import type { NextFunction, Request, Response } from "express";

import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadOne = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message:
            err instanceof multer.MulterError
              ? err.code === "LIMIT_FILE_SIZE"
                ? "File must be less than 10MB"
                : err.message
              : err.message,
        });
      }
      next();
    });
  };
};

const uploadMultiple = (fieldName: string, maxCount = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message:
            err instanceof multer.MulterError
              ? err.code === "LIMIT_FILE_SIZE"
                ? "File must be less than 10MB"
                : err.message
              : err.message,
        });
      }
      next();
    });
  };
};

export { uploadOne, uploadMultiple };
