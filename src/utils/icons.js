import feather from 'feather-icons';

export const initializeIcons = () => {
    feather.replace();
};

// Call this function whenever the DOM updates
export const updateIcons = () => {
    requestAnimationFrame(() => {
        feather.replace();
    });
}; 