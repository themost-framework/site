import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      return hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    },
  }),
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const publicArticlesDir = path.join(projectRoot, 'public', 'articles')
const generatedDir = path.join(projectRoot, 'src', 'generated')
const generatedFile = path.join(generatedDir, 'articles.js')

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    return { meta: {}, body: markdown }
  }

  const [, rawMeta, body] = match
  const meta = {}

  for (const line of rawMeta.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) {
      continue
    }

    const [key, ...rest] = trimmed.split(':')
    meta[key.trim()] = rest.join(':').trim().replace(/^['"]|['"]$/g, '')
  }

  return { meta, body }
}

function toSlug(fileName) {
  return fileName.replace(/\.md$/i, '').trim()
}

function ensureGeneratedDir() {
  fs.mkdirSync(generatedDir, { recursive: true })
}

function compareArticleFiles(firstFile, secondFile) {
  const firstIndex = Number(firstFile.match(/^(\d+)-/)?.[1])
  const secondIndex = Number(secondFile.match(/^(\d+)-/)?.[1])

  if (Number.isFinite(firstIndex) && Number.isFinite(secondIndex) && firstIndex !== secondIndex) {
    return firstIndex - secondIndex
  }

  return firstFile.localeCompare(secondFile)
}

function readArticleFiles() {
  if (!fs.existsSync(publicArticlesDir)) {
    return []
  }

  return fs
    .readdirSync(publicArticlesDir)
    .filter((file) => file.toLowerCase().endsWith('.md'))
  .sort(compareArticleFiles)
    .map((file) => {
      const filePath = path.join(publicArticlesDir, file)
      const markdown = fs.readFileSync(filePath, 'utf8')
      const { meta, body } = parseFrontMatter(markdown)
      const slug = toSlug(file)

      return {
        slug,
        title: meta.title || slug.replace(/[-_]/g, ' '),
        summary: meta.summary || 'Read the article',
        category: meta.category || 'Article',
        readingTime: meta.readingTime || '5 min read',
        source: file,
        contentHtml: marked.parse(body, { breaks: true, gfm: true }),
      }
    })
}

function writeGeneratedIndex(articles) {
  const articleEntries = articles
    .map(
      (article) => `  {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title)},
    summary: ${JSON.stringify(article.summary)},
    category: ${JSON.stringify(article.category)},
    readingTime: ${JSON.stringify(article.readingTime)},
    source: ${JSON.stringify(article.source)},
    contentHtml: ${JSON.stringify(article.contentHtml)},
  }`,
    )
    .join(',\n')

  const articleBySlugEntries = articles
    .map(
      (article) => `  ${JSON.stringify(article.slug)}: {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title)},
    summary: ${JSON.stringify(article.summary)},
    category: ${JSON.stringify(article.category)},
    readingTime: ${JSON.stringify(article.readingTime)},
    source: ${JSON.stringify(article.source)},
    contentHtml: ${JSON.stringify(article.contentHtml)},
  }`,
    )
    .join(',\n')

  const output = `export const articles = [\n${articleEntries}\n]\n\nexport const articleBySlug = {\n${articleBySlugEntries}\n}\n`

  fs.writeFileSync(generatedFile, output, 'utf8')
}

function main() {
  ensureGeneratedDir()
  const articles = readArticleFiles()
  writeGeneratedIndex(articles)
  console.log(`Generated ${articles.length} article metadata entries.`)
}

main()
