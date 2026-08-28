interface User{
    user_id: string;
    name: string;
    email: string;
    password_hash: string;
    avatar_url: string;
    email_verified: boolean;
}

interface UserToken {
  user_id: string;
}

export {User, UserToken};