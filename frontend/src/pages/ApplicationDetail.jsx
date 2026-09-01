import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DOC_TYPE_LABELS = {
  hospital_record: "Hospital Record",
  parent_id: "Parent's ID",
  parent_citizenship: "Parent Citizenship Certificate / ID",
  marriage_certificate: "Parents Marriage Certificate",
  other: "Other",
};

const FILE_ICONS = {
  pdf: "📄",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

function fileIcon(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || "📎";
}

function getDocUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("data:") || filePath.startsWith("http"))
    return filePath;
  let cleanPath = filePath.replace(/\\/g, "/");
  if (cleanPath.includes("uploads/")) {
    cleanPath = cleanPath.slice(cleanPath.indexOf("uploads/"));
  }

  const defaultBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/api`
      : "http://localhost:8000/api";
  const base = import.meta.env.VITE_API_BASE_URL || defaultBase;
  const rootServer = base.replace(/\/api\/?$/, "");
  return `${rootServer}/${cleanPath.replace(/^\//, "")}`;
}

function isImageFile(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Decision form
  const [reason, setReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  const isStaffOrAdmin =
    user && ["ward_staff", "district_staff", "admin"].includes(user.role);

  function loadApplication() {
    api
      .get(`/applications/${id}`)
      .then((res) => setApplication(res.data))
      .catch(() => setError("Could not load application."));
  }

  useEffect(() => {
    loadApplication();
    if (isStaffOrAdmin) {
      api
        .get(`/applications/${id}/audit-logs`)
        .then((res) => setAuditLogs(res.data))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setPreviewDoc(null);
    }
    if (previewDoc) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewDoc]);

  useEffect(() => {
    let objectUrl = null;
    async function fetchPreview() {
      if (!previewDoc) return;
      // If file_path exists and is a URL/data-uri, use it directly
      if (previewDoc.file_path) {
        setPreviewSrc(getDocUrl(previewDoc.file_path));
        return;
      }

      // Otherwise fetch blob from API download endpoint
      setPreviewLoading(true);
      try {
        const res = await api.get(
          `/applications/${id}/documents/${previewDoc.id}`,
          {
            responseType: "blob",
          },
        );
        const blob = res.data;
        objectUrl = URL.createObjectURL(blob);
        setPreviewSrc(objectUrl);
      } catch (err) {
        setError("Could not load document preview.");
      } finally {
        setPreviewLoading(false);
      }
    }

    fetchPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewSrc(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDoc]);


  // ── PDF Generation (Government-style certificate) ──

  async function fetchImageAsDataUrl(doc) {
    try {
      // Try cloudinary_url first (direct image link)
      if (doc.cloudinary_url && isImageFile(doc.file_name)) {
        const response = await fetch(doc.cloudinary_url);
        const blob = await response.blob();
        return await blobToDataUrl(blob);
      }
      // Fallback: fetch from API endpoint
      const res = await api.get(
        `/applications/${id}/documents/${doc.id}`,
        { responseType: "blob" },
      );
      return await blobToDataUrl(res.data);
    } catch {
      return null;
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => {
        resolve({ width: 800, height: 600 });
      };
      img.src = dataUrl;
    });
  }

  function trimImageLetterbox(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image")) return resolve(dataUrl);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          if (!w || !h || w < 50 || h < 50) return resolve(dataUrl);

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const isDarkPixel = (idx) => data[idx] < 40 && data[idx + 1] < 40 && data[idx + 2] < 40;

          // Check top dark rows
          let top = 0;
          for (let y = 0; y < Math.floor(h * 0.45); y++) {
            let allDark = true;
            for (let x = 0; x < w; x += 8) {
              const idx = (y * w + x) * 4;
              if (!isDarkPixel(idx)) {
                allDark = false;
                break;
              }
            }
            if (allDark) top = y;
            else break;
          }

          // Check bottom dark rows
          let bottom = h - 1;
          for (let y = h - 1; y >= Math.ceil(h * 0.55); y--) {
            let allDark = true;
            for (let x = 0; x < w; x += 8) {
              const idx = (y * w + x) * 4;
              if (!isDarkPixel(idx)) {
                allDark = false;
                break;
              }
            }
            if (allDark) bottom = y;
            else break;
          }

          // Check left dark columns
          let left = 0;
          for (let x = 0; x < Math.floor(w * 0.35); x++) {
            let allDark = true;
            for (let y = top; y <= bottom; y += 8) {
              const idx = (y * w + x) * 4;
              if (!isDarkPixel(idx)) {
                allDark = false;
                break;
              }
            }
            if (allDark) left = x;
            else break;
          }

          // Check right dark columns
          let right = w - 1;
          for (let x = w - 1; x >= Math.ceil(w * 0.65); x--) {
            let allDark = true;
            for (let y = top; y <= bottom; y += 8) {
              const idx = (y * w + x) * 4;
              if (!isDarkPixel(idx)) {
                allDark = false;
                break;
              }
            }
            if (allDark) right = x;
            else break;
          }

          const cropW = right - left + 1;
          const cropH = bottom - top + 1;

          // If we trimmed significant black bars (> 4% of dimension)
          if (
            (top > h * 0.04 || bottom < h * 0.96 || left > w * 0.04 || right < w * 0.96) &&
            cropW > w * 0.2 &&
            cropH > h * 0.2
          ) {
            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext("2d");
            cropCtx.drawImage(img, left, top, cropW, cropH, 0, 0, cropW, cropH);
            return resolve(cropCanvas.toDataURL("image/jpeg", 0.95));
          }

          resolve(dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function downloadCertificatePDF() {
    if (!application) return;
    setPdfGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const W = pdf.internal.pageSize.getWidth();   // 210
      const H = pdf.internal.pageSize.getHeight();  // 297
      const margin = 15;
      const innerW = W - margin * 2;

      // ── Double border frame ──
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(1.5);
      pdf.rect(8, 8, W - 16, H - 16);
      pdf.setLineWidth(0.5);
      pdf.rect(11, 11, W - 22, H - 22);

      // ── Header: Nepal Government style ──
      let y = 22;

      // Emblem circle placeholder
      pdf.setFillColor(0, 51, 102);
      pdf.circle(W / 2, y + 8, 9, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("NP", W / 2, y + 10, { align: "center" });
      y += 22;

      // Title block
      pdf.setTextColor(0, 51, 102);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("Government of Nepal", W / 2, y, { align: "center" });
      y += 5;
      pdf.text("Ministry of Home Affairs", W / 2, y, { align: "center" });
      y += 5;
      pdf.text("Department of Civil Registration", W / 2, y, { align: "center" });
      y += 8;

      // Certificate title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 51, 102);
      pdf.text("BIRTH CERTIFICATE APPLICATION", W / 2, y, { align: "center" });
      y += 4;

      // Decorative line under title
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(0.8);
      pdf.line(W / 2 - 40, y, W / 2 + 40, y);
      y += 2;
      pdf.setLineWidth(0.3);
      pdf.line(W / 2 - 35, y, W / 2 + 35, y);
      y += 6;

      // Registration number and date
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80);
      pdf.text(`Registration No: APP-${String(application.id).padStart(6, "0")}`, margin + 5, y);
      pdf.text(
        `Date: ${new Date(application.updated_at || application.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        W - margin - 5, y, { align: "right" }
      );
      y += 8;

      // ── Certificate body ──
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);

      // "This is to certify..." preamble
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40);
      pdf.text(
        "This is to certify that the following birth has been duly registered in the records of the",
        W / 2, y, { align: "center" }
      );
      y += 5;
      pdf.text("Department of Civil Registration, Government of Nepal.", W / 2, y, { align: "center" });
      y += 10;

      // ── Data table ──
      const labelX = margin + 8;
      const valueX = margin + 62;
      const rowH = 9;

      function drawRow(label, value, highlight) {
        // Alternating row background
        if (highlight) {
          pdf.setFillColor(240, 244, 255);
          pdf.rect(margin + 3, y - 5, innerW - 6, rowH, "F");
        }
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100);
        pdf.text(label, labelX, y);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(20);
        pdf.text(String(value || "\u2014"), valueX, y);
        // Bottom line
        pdf.setDrawColor(220);
        pdf.setLineWidth(0.15);
        pdf.line(margin + 3, y + 3, W - margin - 3, y + 3);
        y += rowH;
      }

      // Section: Child Information
      pdf.setFillColor(0, 51, 102);
      pdf.rect(margin + 3, y - 5, innerW - 6, 7, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255);
      pdf.text("  CHILD INFORMATION", margin + 5, y - 0.5);
      y += 6;

      drawRow("Full Name", application.child_name, true);
      drawRow("Date of Birth", application.date_of_birth, false);
      drawRow("Place of Birth", application.place_of_birth, true);
      drawRow("Gender", application.gender, false);
      y += 3;

      // Section: Parent / Guardian Information
      pdf.setFillColor(0, 51, 102);
      pdf.rect(margin + 3, y - 5, innerW - 6, 7, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255);
      pdf.text("  PARENT / GUARDIAN INFORMATION", margin + 5, y - 0.5);
      y += 6;

      drawRow("Father's Name", application.father_name, true);
      drawRow("Mother's Name", application.mother_name, false);
      drawRow("Permanent Address", application.permanent_address, true);
      y += 3;

      // Section: Registration Details
      pdf.setFillColor(0, 51, 102);
      pdf.rect(margin + 3, y - 5, innerW - 6, 7, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255);
      pdf.text("  REGISTRATION DETAILS", margin + 5, y - 0.5);
      y += 6;

      drawRow("Application ID", `APP-${String(application.id).padStart(6, "0")}`, true);
      drawRow("Status", "APPROVED", false);
      drawRow("Date of Application", new Date(application.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), true);
      drawRow("Date of Approval", new Date(application.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), false);
      y += 5;

      // ── Signature section ──
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);

      const sigY = H - 50;

      // Left: Applicant
      pdf.line(margin + 10, sigY, margin + 65, sigY);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80);
      pdf.text("Applicant's Signature", margin + 18, sigY + 5);

      // Right: Registrar
      pdf.line(W - margin - 65, sigY, W - margin - 10, sigY);
      pdf.text("Registrar's Signature & Seal", W - margin - 63, sigY + 5);

      // Official stamp placeholder circle
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(0.5);
      pdf.circle(W / 2, sigY - 3, 12, "S");
      pdf.setFontSize(6);
      pdf.setTextColor(0, 51, 102);
      pdf.text("OFFICIAL", W / 2, sigY - 5, { align: "center" });
      pdf.text("SEAL", W / 2, sigY - 1, { align: "center" });

      // Footer
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(140);
      pdf.text(
        "This is a computer-generated document issued by the Online Birth Certificate Application System.",
        W / 2, H - 22, { align: "center" }
      );
      pdf.text(
        "Please bring this document along with original documents for verification at the Ward Office.",
        W / 2, H - 18, { align: "center" }
      );

      // ── Page 2: Attached Documents (with embedded images) ──
      const imageDocs = (application.documents || []).filter((d) => isImageFile(d.file_name));

      if (imageDocs.length > 0) {
        pdf.addPage();

        // Border on page 2
        pdf.setDrawColor(0, 51, 102);
        pdf.setLineWidth(1.5);
        pdf.rect(8, 8, W - 16, H - 16);
        pdf.setLineWidth(0.5);
        pdf.rect(11, 11, W - 22, H - 22);

        let py = 22;
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 51, 102);
        pdf.text("ATTACHED SUPPORTING DOCUMENTS", W / 2, py, { align: "center" });
        py += 3;
        pdf.setDrawColor(0, 51, 102);
        pdf.setLineWidth(0.5);
        pdf.line(W / 2 - 45, py, W / 2 + 45, py);
        py += 8;

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100);
        pdf.text(`Application: APP-${String(application.id).padStart(6, "0")}  |  Child: ${application.child_name}`, W / 2, py, { align: "center" });
        py += 10;

        for (let i = 0; i < imageDocs.length; i++) {
          const doc = imageDocs[i];
          let dataUrl = await fetchImageAsDataUrl(doc);
          if (dataUrl) {
            dataUrl = await trimImageLetterbox(dataUrl);
          }

          if (dataUrl) {
            try {
              const { width: origW, height: origH } = await getImageDimensions(dataUrl);
              const imgAspect = origW / origH;

              const maxW = innerW - 10; // 170 mm max printable width
              const maxH = 190; // 190 mm max height per document

              let imgW = maxW;
              let imgH = maxW / imgAspect;

              if (imgH > maxH) {
                imgH = maxH;
                imgW = maxH * imgAspect;
              }

              // Required space for document header text (~15mm) + image + padding (~12mm)
              const requiredSpace = imgH + 27;

              // Check if adding this document will overflow page height
              if (py + requiredSpace > H - 15) {
                pdf.addPage();
                pdf.setDrawColor(0, 51, 102);
                pdf.setLineWidth(1.5);
                pdf.rect(8, 8, W - 16, H - 16);
                pdf.setLineWidth(0.5);
                pdf.rect(11, 11, W - 22, H - 22);
                py = 22;
              }

              // Document label
              pdf.setFontSize(9);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(0, 51, 102);
              pdf.text(`Document ${i + 1}: ${DOC_TYPE_LABELS[doc.document_type] || doc.document_type}`, margin + 5, py);
              py += 2;
              pdf.setFontSize(7);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(120);
              pdf.text(`File: ${doc.file_name}`, margin + 5, py + 3);
              py += 8;

              // Center image horizontally within the printable area
              const imgX = margin + (innerW - imgW) / 2;

              // Document image border matching uncompressed image size
              pdf.setDrawColor(180);
              pdf.setLineWidth(0.3);
              pdf.rect(imgX - 1, py - 1, imgW + 2, imgH + 2);

              const mimeMatch = dataUrl.match(/^data:image\/(png|jpe?g|webp);/i);
              const format = mimeMatch
                ? (mimeMatch[1].toUpperCase() === "JPG" ? "JPEG" : mimeMatch[1].toUpperCase())
                : "JPEG";

              pdf.addImage(dataUrl, format, imgX, py, imgW, imgH);
              py += imgH + 12;
            } catch (err) {
              console.error("Image embed error:", err);
              pdf.setFontSize(8);
              pdf.setTextColor(180);
              pdf.text("[Image could not be embedded]", margin + 10, py + 5);
              py += 15;
            }
          } else {
            pdf.setFontSize(8);
            pdf.setTextColor(180);
            pdf.text("[Image could not be loaded]", margin + 10, py + 5);
            py += 15;
          }
        }
      }

      // Save the PDF
      const fileName = `Birth_Certificate_APP-${String(application.id).padStart(6, "0")}_${application.child_name.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  }


  async function handleDecision(action) {
    setDeciding(true);
    setError("");
    try {
      let endpoint;
      if (user.role === "admin") {
        endpoint = `/applications/${id}/admin-decision`;
      } else if (user.role === "ward_staff") {
        endpoint = `/applications/${id}/ward-decision`;
      } else {
        endpoint = `/applications/${id}/district-decision`;
      }
      const res = await api.post(endpoint, { action, reason: reason || null });
      setApplication(res.data);
      setReason("");
      api
        .get(`/applications/${id}/audit-logs`)
        .then((r) => setAuditLogs(r.data))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed.");
    } finally {
      setDeciding(false);
    }
  }

  if (error && !application)
    return (
      <div className="page-section">
        <div className="alert-error">{error}</div>
        <Link to="/" className="btn-ghost mt-4">
          ← Go Back
        </Link>
      </div>
    );
  if (!application) return <LoadingSpinner text="Loading application…" />;

  const INFO_FIELDS = [
    { label: "Date of Birth", value: application.date_of_birth },
    { label: "Place of Birth", value: application.place_of_birth },
    { label: "Gender", value: application.gender },
    { label: "Father's Name", value: application.father_name },
    { label: "Mother's Name", value: application.mother_name },
    {
      label: "Permanent Address",
      value: application.permanent_address,
      full: true,
    },
  ];

  return (
    <div className="page-section max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 animate-slide-up">
        <div>
          <Link
            to={user?.role === "citizen" ? "/dashboard" : -1}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-600 mb-3 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <span className="block text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full w-fit mb-2">
            Application Details
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 font-display">
            {application.child_name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submitted{" "}
            {new Date(application.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={application.status} size="lg" />
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}

      {/* ── Download Certificate (only when approved) ── */}
      {application.status === "approved" && (
        <div className="card p-6 mb-5 border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
              📜
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 font-display text-lg">Your Application is Approved!</h3>
              <p className="text-sm text-emerald-700 mt-0.5">
                Download the official birth certificate application PDF and bring it to your Ward Office for final processing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadCertificatePDF}
            disabled={pdfGenerating}
            id="download-certificate-pdf"
            className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-wait"
          >
            {pdfGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Birth Certificate (PDF)
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Application Info ── */}
      <div className="card p-6 mb-5 animate-slide-up delay-75">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          Application Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          {INFO_FIELDS.map(({ label, value, full }) => (
            <div key={label} className={full ? "col-span-2 sm:col-span-3" : ""}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-700">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>

        {application.rejection_reason && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
              Rejection Reason
            </p>
            <p className="text-sm text-red-700">
              {application.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* ── Documents ── */}
      <div className="card p-6 mb-5 animate-slide-up delay-100">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          Uploaded Documents
        </h2>

        {application.documents.length === 0 ? (
          <p className="text-slate-400 text-sm py-2">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="space-y-2 mb-5">
            {application.documents.map((doc) => (
              <li
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center justify-between bg-slate-50 hover:bg-brand-50/60 border border-slate-100 hover:border-brand-200 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {fileIcon(doc.file_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 truncate max-w-[200px] sm:max-w-[300px] transition-colors">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">
                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewDoc(doc);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand-700 bg-white hover:bg-brand-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-xs"
                    title="View Document"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}


      </div>

      {/* ── Decision Panel — Ward Staff ── */}
      {user.role === "ward_staff" &&
        ["pending", "under_review"].includes(application.status) && (
          <DecisionPanel
            id="ward-decision"
            title="Ward Review Decision"
            subtitle="Approve, reject, or forward this application to the district office."
            reason={reason}
            setReason={setReason}
            deciding={deciding}
            onApprove={() => handleDecision("approve")}
            onReject={() => handleDecision("reject")}
            onForward={() => handleDecision("forward")}
            showForward
          />
        )}

      {/* ── Decision Panel — District Staff ── */}
      {user.role === "district_staff" && application.status === "forwarded" && (
        <DecisionPanel
          id="district-decision"
          title="District Final Decision"
          subtitle="Make the final decision on this forwarded application."
          reason={reason}
          setReason={setReason}
          deciding={deciding}
          onApprove={() => handleDecision("approve")}
          onReject={() => handleDecision("reject")}
        />
      )}

      {/* ── Admin Override Panel ── */}
      {user.role === "admin" &&
        !["approved", "rejected"].includes(application.status) && (
          <DecisionPanel
            id="admin-decision"
            title="Admin Override"
            subtitle="As admin, you can approve or reject this application at any stage."
            accent="orange"
            reason={reason}
            setReason={setReason}
            deciding={deciding}
            onApprove={() => handleDecision("approve")}
            onReject={() => handleDecision("reject")}
          />
        )}

      {/* ── Audit Log ── */}
      {isStaffOrAdmin && auditLogs.length > 0 && (
        <div className="card p-6 animate-slide-up delay-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5">
            Audit Trail
          </h2>
          <div className="space-y-2">
            {auditLogs.map((log, i) => (
              <div
                key={log.id}
                className="relative flex gap-4 pl-2 timeline-item"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center flex-shrink-0 text-sm">
                  {log.action === "approve"
                    ? "✅"
                    : log.action === "reject"
                      ? "❌"
                      : log.action === "forward"
                        ? "↗️"
                        : "📝"}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 capitalize">
                    {log.action.replace("_", " ")}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-0.5 italic">
                      &ldquo;{log.notes}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">
                  {fileIcon(previewDoc.file_name)}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 truncate font-display">
                    {previewDoc.file_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {DOC_TYPE_LABELS[previewDoc.document_type] ||
                      previewDoc.document_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={
                    previewDoc.file_path
                      ? getDocUrl(previewDoc.file_path)
                      : `${import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api"}/applications/${id}/documents/${previewDoc.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs py-1.5 px-3"
                  title="Open in new tab"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors text-sm font-bold"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-950/5 min-h-[300px]">
              {previewLoading ? (
                <div className="py-12">Loading preview…</div>
              ) : isImageFile(previewDoc.file_name) ? (
                <div className="relative flex items-center justify-center w-full h-full max-h-[70vh]">
                  <img
                    src={previewSrc}
                    alt={previewDoc.file_name}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200/80 bg-white"
                  />
                </div>
              ) : previewDoc.file_name?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewSrc}
                  title={previewDoc.file_name}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 shadow-sm bg-white"
                />
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="text-5xl mb-4">
                    {fileIcon(previewDoc.file_name)}
                  </div>
                  <p className="text-base font-semibold text-slate-700 mb-1">
                    No inline preview available for this file format.
                  </p>
                  <p className="text-xs text-slate-400 mb-6">
                    You can open or download the original file directly in your
                    browser.
                  </p>
                  <a
                    href={getDocUrl(previewDoc.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionPanel({
  id,
  title,
  subtitle,
  accent,
  reason,
  setReason,
  deciding,
  onApprove,
  onReject,
  onForward,
  showForward,
}) {
  const borderColor =
    accent === "orange" ? "border-orange-400" : "border-brand-400";
  return (
    <div
      className={`card p-6 mb-5 border-l-4 ${borderColor} animate-slide-up delay-150`}
    >
      <h2 className="font-bold text-slate-800 font-display mb-0.5">{title}</h2>
      <p className="text-xs text-slate-400 mb-4">{subtitle}</p>

      <label className="label">Reason / Notes</label>
      <textarea
        id={`${id}-reason`}
        placeholder="Required when rejecting. Optional for approve/forward."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input mb-4 resize-none"
        rows={2}
      />

      <div className="flex flex-wrap gap-3">
        <button
          id={`${id}-approve`}
          disabled={deciding}
          onClick={onApprove}
          className="btn-success"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Approve
        </button>
        <button
          id={`${id}-reject`}
          disabled={deciding}
          onClick={onReject}
          className="btn-danger"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Reject
        </button>
        {showForward && (
          <button
            id={`${id}-forward`}
            disabled={deciding}
            onClick={onForward}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:from-violet-700 hover:to-violet-600 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            Forward to District
          </button>
        )}
      </div>
    </div>
  );
}
