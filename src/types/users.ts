export interface CreateUserRequest {
    name: string;
    password: string;
    description?: string;
}

export interface CreateUserResponse {
    success: boolean;
    userId?: string;
    message: string;
}

export interface UpdateUserRequest {
    userId: string;
    name?: string;
    description?: string;
}

export interface UpdateUserResponse {
    success: boolean;
    message: string;
}

export interface DeleteUserRequest {
    userId: string;
}

export interface DeleteUserResponse {
    success: boolean;
    message: string;
}

export interface ListUsersResponse {
    success: boolean;
    users?: Array<{
        id: string;
        name: string;
        role: string;
        description?: string;
        createdAt: string;
        createdBy?: string;
        creatorName?: string;
    }>;
    message: string;
}
