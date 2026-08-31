from typing import Dict, Any, Optional

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.models.application import Document

# Initialize Cloudinary configuration once from application settings
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryService:
    """
    Service layer for handling document uploads, deletions,
    and secure delivery via Cloudinary.
    """

    @staticmethod
    def upload_file(
        file: UploadFile,
        folder: str = "birth_certificates",
    ) -> Dict[str, Any]:
        """
        Uploads an UploadFile directly to Cloudinary without loading the entire
        file into memory. Uses resource_type='auto' to support images, PDFs, etc.
        """
        try:
            file.file.seek(0)
            response = cloudinary.uploader.upload(
                file.file,
                folder=folder,
                resource_type="auto",
            )
            return response
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}",
            )

    @staticmethod
    def delete_file(
        public_id: str,
        resource_type: str = "image",
    ) -> Dict[str, Any]:
        """
        Deletes a document from Cloudinary by its public ID.
        """
        try:
            response = cloudinary.uploader.destroy(
                public_id,
                resource_type=resource_type,
            )
            return response
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete document from Cloudinary: {str(e)}",
            )

    @staticmethod
    def generate_download_url(
        public_id: str,
        resource_type: str = "image",
        attachment: bool = False,
    ) -> str:
        """
        Generates a secure, signed delivery URL for a Cloudinary asset.
        """
        options = {
            "sign_url": True,
            "secure": True,
            "resource_type": resource_type,
        }
        if attachment:
            options["flags"] = "attachment"

        url, _ = cloudinary.utils.cloudinary_url(public_id, **options)
        return url

    @classmethod
    def download_file_response(cls, doc: Document) -> RedirectResponse:
        """
        Verifies document authorization and issues a secure HTTP 307 temporary redirect
        to a signed, time-bound Cloudinary delivery URL.
        """
        if not doc.cloudinary_public_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file identifier not found",
            )

        resource_type = "image"
        if doc.file_content_type and "pdf" in doc.file_content_type.lower():
            if doc.cloudinary_url and "/raw/" in doc.cloudinary_url:
                resource_type = "raw"

        # Generate time-bound signed Cloudinary URL
        signed_url = cls.generate_download_url(
            public_id=doc.cloudinary_public_id,
            resource_type=resource_type,
            attachment=False,
        )

        return RedirectResponse(
            url=signed_url,
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )


cloudinary_service = CloudinaryService()