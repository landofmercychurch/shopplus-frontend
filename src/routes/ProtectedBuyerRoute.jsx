//src/routes/ProtectedBuyerRoute.jsx

import { Navigate } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext";

export default function ProtectedBuyerRoute({ children }) {
    const { user } = useBuyerAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

