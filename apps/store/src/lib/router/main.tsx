import { createRouter } from "./router";
import ReactDOM from "react-dom/client";

const routeConfig = {
    home: {
        path: "/",
    },
    products: {
        path: "/products",
        children: {
            create: {
                path: "/create",
            },
            edit: {
                path: "/edit/:user",
            },
        },
    },
    product: {
        path: "/products/:id",
    },
    products2: {
        path: "/products/:id",
    },
} as const;

const Router = createRouter(routeConfig);

const { Link, Route } = Router;

function App() {
    return (
        <>
            <div className="">
                <div style={{ display: "flex", gap: 16 }}>
                    <Link to={"home"}>home</Link>
                    <Link params={{ id: "1" }} to={"product"}>
                        product 1
                    </Link>
                    <Link to={"products"}>products</Link>

                    <Link to={"products.create"}>create product</Link>
                </div>
                <div className="">
                    <Route name="home">
                        <div className="">home</div>
                    </Route>
                    <Route name="product">
                        <div className="">product</div>
                    </Route>
                    <Route name="products">
                        <div className="">products</div>
                    </Route>
                    <Route name="products.create">
                        <div className="">product create</div>
                    </Route>
                </div>
            </div>
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
