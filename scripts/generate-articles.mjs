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

function createMarkdownRenderer(articlePathMap) {
  return {
    link(token) {
      const { href, text, title } = token
      const titleAttr = title ? ` title="${title}"` : ''

      // Skip external URLs and hash links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
        return `<a href="${href}"${titleAttr}>${text}</a>`
      }

      // Convert .md file paths to article routes
      if (href.endsWith('.md')) {
        const targetSlug = articlePathMap[href]
        if (targetSlug) {
          return `<a href="#/article/${targetSlug}"${titleAttr}>${text}</a>`
        }
        // If file doesn't exist, keep the original href
        return `<a href="${href}"${titleAttr}>${text}</a>`
      }

      return `<a href="${href}"${titleAttr}>${text}</a>`
    },
  }
}

function buildArticlePathMap(allArticles) {
  const map = {}

  for (const article of allArticles) {
    map[article.source] = article.slug
    // Also map with ./ prefix for local references
    map[`./${article.source}`] = article.slug
  }

  return map
}

function resolveRelativePath(fromFilePath, targetHref) {
  const fromDir = path.posix.dirname(fromFilePath)
  let resolvedPath = path.posix.normalize(path.posix.join(fromDir, targetHref))

  // Remove leading ./
  if (resolvedPath.startsWith('./')) {
    resolvedPath = resolvedPath.slice(2)
  }

  return resolvedPath
}

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

// Sort by the optional "index" front matter property; articles without one fall back to the file name prefix.
function resolveIndex(meta, filePath) {
  const fromMeta = meta.index !== undefined && meta.index !== '' ? Number(meta.index) : NaN
  if (Number.isFinite(fromMeta)) {
    return fromMeta
  }
  const fromName = Number(path.basename(filePath).match(/^(\d+)-/)?.[1])
  return Number.isFinite(fromName) ? fromName : Infinity
}

function compareArticles(first, second) {
  if (first.index !== second.index) {
    return first.index < second.index ? -1 : 1
  }
  return first.source.localeCompare(second.source)
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
  const folderIndexFiles = findArticleFiles(publicArticlesDir).filter(isFolderIndex)

  // Build path map for link resolution (collect all articles first)
  const allArticleFiles = findArticleFiles(publicArticlesDir).filter((fp) => !isFolderIndex(fp))
  const pathToSlugMap = {}

  for (const filePath of allArticleFiles) {
    const source = path.relative(publicArticlesDir, filePath).split(path.sep).join('/')
    const slug = toSlug(source)
    pathToSlugMap[source] = slug
    pathToSlugMap[`./${source}`] = slug
  }

  for (const filePath of folderIndexFiles) {
    const folder = path.relative(publicArticlesDir, path.dirname(filePath)).split(path.sep).join('/')

    if (!folder) {
      continue
    }

    const { meta, body } = parseFrontMatter(fs.readFileSync(filePath, 'utf8'))

    // Create folder-specific link resolver
    const createLinkResolver = (fromSource) => {
      return {
        link(token) {
          const { href, text, title } = token
          const titleAttr = title ? ` title="${title}"` : ''

          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
            return `<a href="${href}"${titleAttr}>${text}</a>`
          }

          if (href.endsWith('.md')) {
            const resolvedPath = resolveRelativePath(fromSource, href)
            const targetSlug = pathToSlugMap[resolvedPath]

            if (targetSlug) {
              return `<a href="#/article/${targetSlug}"${titleAttr}>${text}</a>`
            }

            console.warn(`Warning: Folder link not found: ${href} from ${fromSource} (resolved to ${resolvedPath})`)
            return `<a href="${href}"${titleAttr}>${text}</a>`
          }

          return `<a href="${href}"${titleAttr}>${text}</a>`
        },
      }
    }

    const markedWithResolver = new Marked(
      markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          return hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        },
      }),
    )
    markedWithResolver.use({ renderer: createLinkResolver(`${folder}/index.md`) })

    folders[folder] = {
      title: meta.title || '',
      summary: meta.summary || '',
      category: meta.category || '',
      contentHtml: body.trim() ? markedWithResolver.parse(body, { breaks: true, gfm: true }) : '',
    }
  }

  return folders
}

function readArticleFiles() {
  if (!fs.existsSync(publicArticlesDir)) {
    return []
  }

  // First pass: collect all article metadata without parsing HTML
  const rawArticles = findArticleFiles(publicArticlesDir)
    .filter((filePath) => !isFolderIndex(filePath))
    .map((filePath) => {
      const source = path.relative(publicArticlesDir, filePath).split(path.sep).join('/')
      const markdown = fs.readFileSync(filePath, 'utf8')
      const { meta, body } = parseFrontMatter(markdown)
      const slug = toSlug(source)
      const index = resolveIndex(meta, filePath)

      return {
        slug,
        folder: path.posix.dirname(source) === '.' ? '' : path.posix.dirname(source),
        title: meta.title || slug.replace(/[-_]/g, ' '),
        summary: meta.summary || 'Read the article',
        category: meta.category || 'Article',
        readingTime: meta.readingTime || '5 min read',
        source,
        index,
        body,
        _filePath: filePath,
      }
    })

  // Build a map of relative paths to slugs for link resolution
  const pathToSlugMap = {}
  for (const article of rawArticles) {
    pathToSlugMap[article.source] = article.slug
    pathToSlugMap[`./${article.source}`] = article.slug
  }

  // Second pass: parse markdown with link resolution
  return rawArticles
    .map((article) => {
      // Create article-specific link resolver
      const createLinkResolver = (fromSource) => {
        const fromDir = path.posix.dirname(fromSource)

        return {
          link(token) {
            const { href, text, title } = token
            const titleAttr = title ? ` title="${title}"` : ''

            // Skip external URLs and hash links
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
              return `<a href="${href}"${titleAttr}>${text}</a>`
            }

            // Convert .md file paths to article routes
            if (href.endsWith('.md')) {
              const resolvedPath = resolveRelativePath(fromSource, href)
              const targetSlug = pathToSlugMap[resolvedPath]

              if (targetSlug) {
                return `<a href="#/article/${targetSlug}"${titleAttr}>${text}</a>`
              }

              // If file doesn't exist, keep the original href as a warning
              console.warn(`Warning: Article link not found: ${href} from ${fromSource} (resolved to ${resolvedPath})`)
              return `<a href="${href}"${titleAttr}>${text}</a>`
            }

            return `<a href="${href}"${titleAttr}>${text}</a>`
          },
        }
      }

      // Use a temporary marked instance with the article-specific renderer
      const markedWithResolver = new Marked(
        markedHighlight({
          emptyLangClass: 'hljs',
          langPrefix: 'hljs language-',
          highlight(code, lang) {
            return hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          },
        }),
      )
      markedWithResolver.use({ renderer: createLinkResolver(article.source) })

      return {
        slug: article.slug,
        folder: article.folder,
        title: article.title,
        summary: article.summary,
        category: article.category,
        readingTime: article.readingTime,
        source: article.source,
        index: article.index,
        contentHtml: markedWithResolver.parse(article.body, { breaks: true, gfm: true }),
      }
    })
    .sort(compareArticles)
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
