import MarkdownIt from 'markdown-it'
import MarkdownItKaTeX from 'markdown-it-katex'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import './Markdown.css'

import 'katex/dist/katex.min.css'

let md = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: true,
  inline: true,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(lang, str, true).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(MarkdownItKaTeX, {
  "throwOnError" : false,
  "errorColor" : "#aa0000"
})

export default (text) => md.render(text)