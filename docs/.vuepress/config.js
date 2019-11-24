module.exports = {
  title: 'Erra文档',
  description: 'Erra文档',
  base: '/erra/',
  themeConfig: {
    nav: [{
      text: 'GitHub',
      link: 'https://github.com/hughfenghen/erra',
      target: '_self',
      rel: '',
    }, {
      text: '风痕的博客',
      link: 'https://hughfenghen.github.io/',
      target: '_self',
      rel: '',
    }],
    sidebarDepth: 2,
    sidebar: [
      '/',
      '/start',
      '/trust-ca',
      '/guide',
      '/config-desc',
      '/design',
    ],
  },
}