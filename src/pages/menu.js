const menus = [
    {
        id: 1,
        name: 'Home',
        links: '/'
    },
    {
        id: 2,
        name: 'Buy Crypto',
        links: '#',
        namesub: [
            {
                id: 1,
                sub: 'Buy Crypto Select',
                links: '/buy-crypto-select'
            },
            {
                id: 2,
                sub: 'Buy Crypto Confirm',
                links: '/buy-crypto-confirm'
            },
            {
                id: 3,
                sub: 'Buy Crypto Details',
                links: '/buy-crypto-details'
            },
        ]
    },
    {
        id: 3,
        name: 'Markets ',
        links: '/markets'
    },
    {
        id: 4,
        name: 'Sell Crypto',
        links: '#',
        namesub: [
            {
                id: 1,
                sub: 'Sell Select',
                links: '/sell-select'
            },
            {
                id: 2,
                sub: 'Sell Crypto Amount',
                links: '/sell-crypto-amount'
            },
            {
                id: 3,
                sub: 'Sell Crypto Confirm',
                links: '/sell-crypto-confirm'
            },
            {
                id: 4,
                sub: 'Sell Crypto Details',
                links: '/sell-crypto-details'
            },
        ],
    },
    {
        id: 5,
        name: 'Blog',
        links: '#',
        namesub: [
            {
                id: 1,
                sub: 'Blog Default',
                links: '/blog-default'
            },
            {
                id: 2,
                sub: 'Blog Grid v1',
                links: '/blog-grid-v1'
            },
            {
                id: 3,
                sub: 'Blog Grid v2',
                links: '/blog-grid-v2'
            },
            {
                id: 4,
                sub: 'Blog List',
                links: '/blog-list'
            },
            {
                id: 5,
                sub: 'Blog Details',
                links: '/blog-details'
            },
        ],
    },
    {
        id: 6,
        name: 'BITUSDT',
        links: '/wallet'
    },

    {
        id: 7,
        name: 'Pages',
        links: '#',
        namesub: [
            {
                id: 1,
                sub: 'User Profile',
                links: '/user-profile'
            },
            {
                id: 2,
                sub: 'Login',
                links: '/login'
            },
            {
                id: 3,
                sub: 'Register',
                links: '/register'
            },
            {
                id: 4,
                sub: 'Contact',
                links: '/contact'
            },
            {
                id: 5,
                sub: 'FAQ',
                links: '/faq'
            },
        ],
    },
    
]

export default menus;