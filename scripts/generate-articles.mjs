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
  const firstName = path.basename(firstFile)
  const secondName = path.basename(secondFile)
  const firstIndex = Number(firstName.match(/^(\d+)-/)?.[1])
  const secondIndex = Number(secondName.match(/^(\d+)-/)?.[1])

  if (Number.isFinite(firstIndex) && Number.isFinite(secondIndex) && firstIndex !== secondIndex) {
    return firstIndex - secondIndex
  }

  return firstFile.localeCompare(secondFile)
}

function findArticleFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return findArticleFiles(entryPath)
    }

    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [entryPath] : []
  })
}

// A folder's index.md describes the folder (home tile and folder page) and is not an article.
function isFolderIndex(filePath) {
  return path.basename(filePath).toLowerCase() === 'index.md'
}

function readFolders() {
  if (!fs.existsSync(publicArticlesDir)) {
    return {}
  }

  const folders = {}

  for (const filePath of findArticleFiles(publicArticlesDir).filter(isFolderIndex)) {
    const folder = path.relative(publicArticlesDir, path.dirname(filePath)).split(path.sep).join('/')

    if (!folder) {
      continue
    }

    const { meta, body } = parseFrontMatter(fs.readFileSync(filePath, 'utf8'))
    folders[folder] = {
      title: meta.title || '',
      summary: meta.summary || '',
      category: meta.category || '',
      contentHtml: body.trim() ? marked.parse(body, { breaks: true, gfm: true }) : '',
    }
  }

  return folders
}

function readArticleFiles() {
  if (!fs.existsSync(publicArticlesDir)) {
    return []
  }

  return findArticleFiles(publicArticlesDir)
    .filter((filePath) => !isFolderIndex(filePath))
    .sort((firstPath, secondPath) =>
      compareArticleFiles(
        path.relative(publicArticlesDir, firstPath),
        path.relative(publicArticlesDir, secondPath),
      ),
    )
    .map((filePath) => {
      const source = path.relative(publicArticlesDir, filePath).split(path.sep).join('/')
      const markdown = fs.readFileSync(filePath, 'utf8')
      const { meta, body } = parseFrontMatter(markdown)
      const slug = toSlug(source)

      return {
        slug,
        folder: path.posix.dirname(source) === '.' ? '' : path.posix.dirname(source),
        title: meta.title || slug.replace(/[-_]/g, ' '),
        summary: meta.summary || 'Read the article',
        category: meta.category || 'Article',
        readingTime: meta.readingTime || '5 min read',
        source,
        contentHtml: marked.parse(body, { breaks: true, gfm: true }),
      }
    })
}

function writeGeneratedIndex(articles, folders) {
  const articleEntries = articles
    .map(
      (article) => `  {
    slug: ${JSON.stringify(article.slug)},
    folder: ${JSON.stringify(article.folder)},
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
    folder: ${JSON.stringify(article.folder)},
    title: ${JSON.stringify(article.title)},
    summary: ${JSON.stringify(article.summary)},
    category: ${JSON.stringify(article.category)},
    readingTime: ${JSON.stringify(article.readingTime)},
    source: ${JSON.stringify(article.source)},
    contentHtml: ${JSON.stringify(article.contentHtml)},
  }`,
    )
    .join(',\n')

  const output = `export const articles = [\n${articleEntries}\n]\n\nexport const articleBySlug = {\n${articleBySlugEntries}\n}\n\nexport const folders = ${JSON.stringify(folders, null, 2)}\n`

  fs.writeFileSync(generatedFile, output, 'utf8')
}

function main() {
  ensureGeneratedDir()
  const articles = readArticleFiles()
  writeGeneratedIndex(articles, readFolders())
  console.log(`Generated ${articles.length} article metadata entries.`)
}

main()
