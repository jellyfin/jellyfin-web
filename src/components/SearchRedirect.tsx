import { useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirects /search to the quick search modal.
 * Opens the modal and navigates back to the previous page.
 */
const SearchRedirect: FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Open the quick search modal
        window.dispatchEvent(new CustomEvent('quicksearch:open'));
        // Navigate back (or to home if no history)
        navigate(-1);
    }, [navigate]);

    return null;
};

export default SearchRedirect;
