import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import argon2 from "argon2";

import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { LoginInput } from "../types/LoginInput";

import { User } from "../entities/User";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constants";

@Resolver()

export class UserResolve {

    @Mutation(_returns => UserMutationResponse, { nullable: true })
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
        @Ctx() { req }: Context

    ): Promise<UserMutationResponse> {

        const validateInputRegisterErrors = validateRegisterInput(registerInput)

        if (validateInputRegisterErrors !== null) {
            return {
                code: 400,
                success: false,
                ...validateInputRegisterErrors
            }
        }

        try {

            const { username, password, email } = registerInput
            const existingUser = await User.findOne({ where: [{ username }, { email }] })

            if (existingUser) return {
                code: 400,
                success: false,
                message: "User already exists",
                errors: [{
                    field: existingUser.username === username ? "Username " : " email ",
                    message: `${existingUser.username === username ? "Username" : "Email"} already exists`
                }]
            }

            const hashedPassword = await argon2.hash(password)

            let newUser = User.create({
                email,
                username,
                password: hashedPassword
            })

            newUser = await newUser.save()

            req.session.userId = newUser.id

            return {
                code: 200,
                success: true,
                message: "User created successfully",
                user: newUser
            }
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                success: false,
                message: `Internal server error ${err.message}`,
            }
        }

    }

    @Mutation(_return => UserMutationResponse)
    async login(
        @Arg('loginInput') { usernameOrEmail, password }: LoginInput,
        @Ctx() { req }: Context): Promise<UserMutationResponse> {

        try {

            const existingUser = await User.findOne(usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail })

            if (!existingUser) {
                return {
                    code: 400,
                    success: false,
                    message: "User not found",
                    errors: [{
                        field: 'usernameOrEmail',
                        message: 'Username or email incorrectly provided'
                    }]
                }
            }

            const passwordValid = await argon2.verify(existingUser.password, password)

            if (!passwordValid) {
                return {
                    code: 400,
                    success: false,
                    message: "Password wrong",
                    errors: [{
                        field: 'password',
                        message: 'Password incorrect'
                    }]
                }
            }

            req.session.userId = existingUser.id

            return { code: 200, success: true, message: 'Successfully authenticated', user: existingUser }

        } catch (error) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            }
        }
    }

    @Mutation(_return => Boolean)
    logout(@Ctx() { req, res }: Context): Promise<boolean> {

        return new Promise((resolve, _reject) => {
            res.clearCookie(COOKIE_NAME)
            req.session.destroy(err => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                resolve(true);
            })
        })
    }
}