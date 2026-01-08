export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#6297B1',
                danger: '#852221',
                'primary-container': '#C2DADF',
                'on-primary-container': '#454659',
                background: '#203452',
                surface: '#344F78',
                'on-primary': '#FFFFFF',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'card': '16px',
                'btn': '50px',
            },
        },
    },
    plugins: [],
}
