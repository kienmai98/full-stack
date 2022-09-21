import { Query, Resolver } from "type-graphql";

@Resolver()

export class HelloResolve {

    @Query(_returns => String )
    hello() {
        return "Hello";
    }
}