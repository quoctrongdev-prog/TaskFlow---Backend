interface User{
    user_id: number;
    name: string;
    email: string;
    password_hash: string;
    avatar_url: string;
    email_verified: boolean;
}

export {User};