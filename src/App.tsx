import RecipeDetail from '@/pages/RecipeDetail';
import { CssBaseline, Theme, ThemeProvider } from '@mui/material';
import { User, onAuthStateChanged } from 'firebase/auth';
import React, { useContext, useEffect, useMemo } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import TastealHashLoader from './components/common/progress/TastealHashLoader';
import CheckSignIn from './components/ui/app/CheckSignIn';
import NotFound from './components/ui/app/NotFound';
import { PageRoute } from './lib/constants/common';
import AppContext from './lib/contexts/AppContext';
import ColorModeContext from './lib/contexts/ColorModeContext';
import SnackbarProvider from './lib/contexts/snackbarContext';
import { auth } from './lib/firebase/config';
import useTastealTheme from './lib/hooks/useTastealTheme';
import CreateRecipe from './pages/CreateRecipe';
import ForgotPass from './pages/ForgotPass';
import Grocery from './pages/Grocery';
import Home from './pages/Home';
import MealPlanner from './pages/MealPlanner';
import MySavedRecipes from './pages/MySavedRecipes';
import Search from './pages/Search';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SignUpEmail from './pages/SignUpEmail';
import ScrollToTop from './components/ui/app/ScrollToTop';

//#region AppWrapper

type AppWrapperProps = {
    colorMode: {
        toggleColorMode: () => void;
    };
    theme: Theme;
    spinner: boolean;
    //
    handleSpinner: (value: boolean) => void;
    login: {
        isUserSignedIn?: boolean;
        user?: User;
        handleLogin: (isUserSignedIn?: boolean, user?: User) => void;
    };
};

function AppWrapper({
    children,
    colorMode,
    theme,
    spinner,
    ...contextProps
}: React.PropsWithChildren & AppWrapperProps) {
    return (
        <AppContext.Provider value={{ ...contextProps }}>
            <ColorModeContext.Provider value={colorMode}>
                <CssBaseline />
                <ThemeProvider theme={theme}>
                    <SnackbarProvider>
                        <TastealHashLoader spinner={spinner} />
                        {children}
                    </SnackbarProvider>
                </ThemeProvider>
            </ColorModeContext.Provider>
        </AppContext.Provider>
    );
}

//#endregion

//#region AllRoutes
function AllRoutes() {
    const { login, handleSpinner } = useContext(AppContext);

    // Check if login ?
    useEffect(() => {
        if (login.isUserSignedIn == undefined) {
            handleSpinner(true);
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user && login.handleLogin) {
                    login.handleLogin(true, user);
                } else {
                    login.handleLogin(false);
                }
            });
            handleSpinner(false);
            return () => unsubscribe();
        }
    }, []);

    const MapRoutes = useMemo(() => {
        return [
            {
                path: PageRoute.Home,
                element: <Home />,
            },
            {
                path: PageRoute.Search,
                element: <Search />,
            },
            {
                path: PageRoute.Recipe.Detail(),
                element: <RecipeDetail />,
            },
            // Chưa đăng nhập
            {
                path: PageRoute.SignIn,
                element: <SignIn />,
                checkAlready: true,
            },
            {
                path: PageRoute.SignUp,
                element: <SignUp />,
                checkAlready: true,
            },
            {
                path: PageRoute.SignUpEmail,
                element: <SignUpEmail />,
                checkAlready: true,
            },
            {
                path: PageRoute.ForgotPass,
                element: <ForgotPass />,
                checkAlready: true,
            },
            // Đã đăng nhập
            {
                path: PageRoute.Recipe.Create,
                element: <CreateRecipe />,
                needSignIn: PageRoute.Recipe.Create,
            },
            {
                path: PageRoute.Grocery,
                element: <Grocery />,
                needSignIn: PageRoute.Grocery,
            },
            {
                path: PageRoute.MealPlanner,
                element: <MealPlanner />,
                needSignIn: PageRoute.MealPlanner,
            },
            {
                path: PageRoute.MySavedRecipes,
                element: <MySavedRecipes />,
                needSignIn: PageRoute.MySavedRecipes,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ];
    }, []);

    return (
        <>
            <Router>
                <ScrollToTop />
                <Routes>
                    {MapRoutes.map(
                        ({ path, element, checkAlready, needSignIn }) => (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <CheckSignIn
                                        checkAlready={checkAlready}
                                        needSignIn={needSignIn}
                                    >
                                        <>{element}</>
                                    </CheckSignIn>
                                }
                            />
                        )
                    )}
                </Routes>
            </Router>
        </>
    );
}
//#endregion

function App() {
    const themeProps = useTastealTheme();

    return (
        <AppWrapper {...themeProps}>
            <AllRoutes />
        </AppWrapper>
    );
}

export default App;
