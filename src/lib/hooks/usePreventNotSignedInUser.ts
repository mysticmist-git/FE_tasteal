import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import useSnackbarService from './useSnackbar';

export default function usePreventNotSignedInUser() {
    const navigate = useNavigate();
    const [snackbarAlert] = useSnackbarService();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) return;

            // Navigate user back if they've already signed in.
            navigate('/');
            snackbarAlert('Vui lòng đăng nhập!', 'warning');
        });

        return () => unsubscribe();
    }, [navigate, snackbarAlert]);
}