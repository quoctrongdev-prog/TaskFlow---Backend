// Custom Error class để tạo lỗi có statusCode (404, 400, 500...)
// Dùng để xử lý lỗi tập trung trong Express
// tạo lỗi tùy chỉnh
// ↓
// gắn thêm statusCode
// ↓
// dùng cho error middleware

export default class ErrorHandler extends Error{
    statusCode: number;

    constructor(statusCode: number, message: string) {
        //kế thừa message từ Error của Javascript
        super(message);

        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}