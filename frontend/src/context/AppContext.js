import { createContext, useContext } from "react";

export const ThemeContext = createContext();
export const AuthContext = createContext();

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);
