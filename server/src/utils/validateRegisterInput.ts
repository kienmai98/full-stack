import { RegisterInput } from "../types/RegisterInput";

export const validateRegisterInput = (registerInput: RegisterInput) => {
    if (!registerInput?.email.includes('@'))
        return {
            message: 'Invalid email address',
            errors: [
                {
                    field: 'email',
                    message: 'Invalid email address missing @'
                }
            ]
        }

    if (registerInput?.username.length < 4) {
        return {
            message: 'Invalid username',
            errors: [
                {
                    field: 'username',
                    message: 'Username must be at least 4 characters'
                }
            ]
        }
    }

    if (registerInput.username.includes('@')) {
        return {
            message: 'Invalid username',
            errors: [
                {
                    field: 'username',
                    message: "Username can not contain @"
                }
            ]
        }
    }

    if (registerInput?.password.length <= 2) {
        return {
            message: 'Invalid password',
            errors: [
                {
                    field: 'password',
                    message: 'Password must be at least 2 characters'
                }
            ]
        }
    }
}