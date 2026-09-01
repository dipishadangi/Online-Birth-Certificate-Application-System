import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.models.application import Document

# Initialize Cloudinary from app settings
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryService:
    """Handles document uploads, deletions, and secure delivery via Cloudinary."""

    @staticmethod
    def upload_file(file: UploadFile, folder: str = "birth_certificates") -> dict:
        try:
            file.file.seek(0)
            file_bytes = file.file.read()

            content_type = (file.content_type or "").lower()
            filename = (file.filename or "").lower()
            resource_type = "raw" if ("pdf" in content_type or filename.endswith(".pdf")) else "auto"

            return cloudinary.uploader.upload(file_bytes, folder=folder, resource_type=resource_type)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {e}",
            )

    @staticmethod
    def delete_file(public_id: str, resource_type: str = "image") -> dict:
        try:
            return cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete from Cloudinary: {e}",
            )

    @staticmethod
    def generate_download_url(public_id: str, resource_type: str = "image", attachment: bool = False) -> str:
        options = {"sign_url": True, "secure": True, "resource_type": resource_type}
        if attachment:
            options["flags"] = "attachment"
        url, _ = cloudinary.utils.cloudinary_url(public_id, **options)
        return url

    @classmethod
    def download_file_response(cls, doc: Document) -> RedirectResponse:
        if not doc.cloudinary_public_id:
            raise HTTPException(status_code=404, detail="Document file identifier not found")

        resource_type = "image"
        if doc.file_content_type and "pdf" in doc.file_content_type.lower():
            if doc.cloudinary_url and "/raw/" in doc.cloudinary_url:
                resource_type = "raw"

        signed_url = cls.generate_download_url(doc.cloudinary_public_id, resource_type)
        return RedirectResponse(url=signed_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


cloudinary_service = CloudinaryService()