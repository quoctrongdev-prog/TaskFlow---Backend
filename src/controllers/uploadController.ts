import { Response } from "express";
import cloudinary from "../config/cloudinary.js";
import ErrorHandler from "../config/errorHandler.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import sql from "../config/db.js";

const upload = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const file = req.file;

    // Kiểm tra user đăng nhập
    if (!userId) {
      throw new ErrorHandler(401, "Unauthorized");
    }

    // Kiểm tra file
    if (!file || !file.buffer || file.size === 0) {
      throw new ErrorHandler(400, "File cannot be empty");
    }

    // Lấy avatar hiện tại của user
    const record = await sql`
      SELECT user_id, avatar_url, avatar_public_id
      FROM users
      WHERE user_id = ${userId}
    `;

    // User không tồn tại
    if (record.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }

    const user = record[0];

    // Nếu user đã có avatar thì xóa avatar cũ
    // public_id trên cloudinary
    if (user.avatar_public_id) {
      await cloudinary.uploader.destroy(user.avatar_public_id);
    }

    // console.log({
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   size: file.size,
    // });

    // Upload avatar mới lên Cloudinary
    // Sử dụng Promise để xử lý upload ảnh
    // Trả về secure_url và public_id của ảnh mới

    // const cloud = await cloudinary.uploader.upload(dataURI, {
    //   folder: "taskflow/avatars",
    //   resource_type: "auto",
    // });

    // Chuyển buffer thành dạng datauri string để upload bằng cloudinary.uploader.upload
    // const base64 = file.buffer.toString("base64");

    // const dataUri = `data:${file.mimetype};base64,${base64}`;

    // const cloud  = await cloudinary.uploader.upload(dataUri, {
    //   folder: "avatars",
    // });

    // console.log("UPLOAD SUCCESS:", cloud);

    const cloud = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      stream.end(file.buffer);
    });

    // const auth = Buffer.from(
    //   `${process.env.API_CLOUD_KEY}:${process.env.API_CLOUD_SECRET}`,
    // ).toString("base64");

    // const bytes = new Uint8Array(file.buffer.length);
    // bytes.set(file.buffer);

    // const form = new FormData();

    // form.append(
    //   "file",
    //   new Blob([bytes.buffer], { type: file.mimetype }),
    //   file.originalname,
    // );

    // const response = await fetch(
    //   `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${auth}`,
    //     },
    //     body: form,
    //   },
    // );

    // console.log("STATUS:", response.status);
    // console.log("HEADERS:", Object.fromEntries(response.headers.entries()));

    // const body = await response.text();

    // console.log("BODY:", body);

    // Lưu thông tin avatar mới vào database
    await sql`
      UPDATE users
      SET
        avatar_url = ${cloud.secure_url},
        avatar_public_id = ${cloud.public_id},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      url: cloud.secure_url,
      public_id: cloud.public_id,
      // message: "Avatar uploaded successfully",
    });
  } catch (error: any) {
    console.log("========== CLOUDINARY ERROR ==========");
    console.log("message:", error?.message);
    console.log("http_code:", error?.http_code);
    console.log("name:", error?.name);
    console.log("error:", error);
    console.log("response:", error?.response);
    console.log("headers:", error?.response?.headers);
    console.log("body:", error?.response?.body);
    console.log("======================================");

    return res.status(500).json({
      message: error?.message || "Upload failed",
      http_code: error?.http_code,
      name: error?.name,
    });
  }
};

const uploadTest = async (req: AuthRequest, res: Response) => {
  const file = req.file;

  if (!file || !file.buffer || file.size === 0) {
    throw new ErrorHandler(400, "File cannot be empty");
  }

  // Chuyển Buffer thành Data URI để Cloudinary có thể nhận diện
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  try {
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "avatars", // Tùy chọn thư mục trên Cloudinary
    });

    return res.status(200).json({
      success: true,
      message: "Upload thành công",
      data: result,
    });
  } catch (error: any) {
    console.error("Lỗi Cloudinary chi tiết:", error);
    throw new ErrorHandler(
      500,
      error.message || "Lỗi khi upload lên Cloudinary",
    );
  }
};

export { uploadTest, upload };
