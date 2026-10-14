import { useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes, useParams } from 'react-router-dom'
import { articles, articleBySlug, folders as folderMeta } from './generated/articles'
import './App.css'

function folderLabel(folderPath) {
  const name = folderPath.split('/').pop().replace(/[-_]/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Title from the folder's index.md, falling back to its path.
function folderTitle(folderPath) {
  return folderMeta[folderPath]?.title || folderPath.split('/').map(folderLabel).join(' / ')
}

// Direct articles and immediate sub-folders of a folder ('' is the root).
function listFolder(folder) {
  const prefix = folder ? `${folder}/` : ''
  const folders = new Map()
  const folderPaths = new Set([
    ...articles.map((article) => article.folder),
    ...Object.keys(folderMeta),
  ])

  for (const folderPath of folderPaths) {
    if (!folderPath.startsWith(prefix) || folderPath === folder) {
      continue
    }
    const name = folderPath.slice(prefix.length).split('/')[0]
    if (!folders.has(name)) {
      folders.set(name, { path: `${prefix}${name}`, count: countArticles(`${prefix}${name}`) })
    }
  }

  return {
    articles: articles.filter((article) => article.folder === folder),
    folders: [...folders.values()],
  }
}

function countArticles(folderPath) {
  return articles.filter(
    (article) => article.folder === folderPath || article.folder.startsWith(`${folderPath}/`),
  ).length
}

// Every folder at any depth, with the number of articles beneath it.
function listAllFolders() {
  const paths = new Set(Object.keys(folderMeta))

  for (const article of articles) {
    const segments = article.folder ? article.folder.split('/') : []
    for (let depth = 1; depth <= segments.length; depth += 1) {
      paths.add(segments.slice(0, depth).join('/'))
    }
  }

  return [...paths].sort().map((folderPath) => ({ path: folderPath, count: countArticles(folderPath) }))
}

function FolderCard({ folder }) {
  return (
    <Link className="article-card-item" to={`/folder/${folder.path}`}>
      <div className="article-card-top">
        <span className="mini-label">{folderMeta[folder.path]?.category || 'Folder'}</span>
        <span className="reading-time">{folder.count} {folder.count === 1 ? 'article' : 'articles'}</span>
      </div>
      <h3>{folderTitle(folder.path)}</h3>
      <p>{folderMeta[folder.path]?.summary || 'Browse the articles in this section.'}</p>
      <span className="card-link">Explore articles →</span>
    </Link>
  )
}

function ArticleCard({ article }) {
  return (
    <Link className="article-card-item" to={`/article/${article.slug}`}>
      <div className="article-card-top">
        <span className="mini-label">{article.category}</span>
        <span className="reading-time">{article.readingTime}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <span className="card-link">Read article →</span>
    </Link>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function FolderPage({ theme, onToggleTheme }) {
  const { '*': folder } = useParams()
  const entries = listFolder(folder)
  const parent = folder.includes('/') ? `/folder/${folder.slice(0, folder.lastIndexOf('/'))}` : '/'
  const meta = folderMeta[folder]

  if (entries.articles.length === 0 && entries.folders.length === 0 && !meta) {
    return (
      <div className="article-shell error-state">
        <h1>Folder not found</h1>
        <Link className="primary-button" to="/">
          Return home
        </Link>
      </div>
    )
  }

  return (
    <div className="article-shell">
      <header className="article-header">
        <Link className="crumb" to={parent}>
          ← Back
        </Link>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
      <section className="article-section">
        <div className="section-heading">
          <p className="eyebrow">Articles</p>
          <h2>{folderTitle(folder)}</h2>
          {meta?.summary && <p className="article-summary-text">{meta.summary}</p>}
        </div>
        {meta?.contentHtml && (
          <div className="article-body" dangerouslySetInnerHTML={{ __html: meta.contentHtml }} />
        )}
        <div className="article-grid">
          {entries.folders.map((entry) => (
            <FolderCard key={entry.path} folder={entry} />
          ))}
          {entries.articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}

// Hash routing owns location.hash, so in-page anchors scroll programmatically.
function SectionLink({ to, ...props }) {
  const handleClick = (event) => {
    event.preventDefault()
    document.getElementById(to)?.scrollIntoView({ behavior: 'smooth' })
  }

  return <a href={`#/#${to}`} onClick={handleClick} {...props} />
}

function FrontPage({ theme, onToggleTheme }) {
  const [searchTerm, setSearchTerm] = useState('')
  const featuredArticle = articles[0] ?? {
    slug: 'data-fundamentals',
    title: '@themost-framework Fundamentals',
  }
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((article) => {
      const searchableText = [article.title, article.summary, article.category, article.contentHtml]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearchTerm)
    })
    : articles
  const rootEntries = { articles: listFolder('').articles, folders: listAllFolders() }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark">
            <img src="images/themost_framework_v3_192.png" alt="@themost-framework logo" />
          </span>
          <div>
            <div className="brand-name">themost</div>
            <div className="brand-sub">framework</div>
          </div>
        </div>

        <nav className="nav">
          <SectionLink to="overview">Overview</SectionLink>
          <SectionLink to="foundations">Foundations</SectionLink>
          <SectionLink to="learn">Learn</SectionLink>
          <a href="https://github.com/themost-framework" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>

        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Link className="primary-button slim" to={`/article/${featuredArticle.slug}`}>
            Read the guide
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Model-first application framework</p>
            <h1>@themost-framework</h1>
            <p className="lead">
              Build resilient business applications around a shared model. Define your
              domain once, query it naturally, and keep persistence details out of the
              logic that makes your product unique.
            </p>
            <div className="cta-row">
              <Link className="primary-button" to={`/article/${featuredArticle.slug}`}>
                Explore fundamentals
              </Link>
              <SectionLink className="secondary-button" to="overview">
                See the essentials
              </SectionLink>
            </div>
          </div>

          <div className="hero-panel">
            <img
              className="hero-boomerang"
              src="/images/boomerangs_green_purp.png"
              alt="Green and purple boomerang shapes"
            />
            <div className="panel-header">
              <span className="dot dot-blue" />
              <span className="dot dot-violet" />
              <span className="dot dot-green" />
            </div>

            <div className="panel-body">
              <div className="panel-chip">Built around your domain</div>
              <h2>Business logic, made portable</h2>
              <ul>
                <li>Schema-driven models and relationships</li>
                <li>Readable queries across data providers</li>
                <li>Events and transactions for dependable workflows</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="framework-jumbotron" aria-labelledby="jumbotron-title">
          <div className="jumbotron-copy">
            <p className="eyebrow">The framework's superpower</p>
            <h2 id="jumbotron-title">One model. Every surface.</h2>
            <p>
              @themost-framework turns the same domain definition into queryable data,
              connected relationships, API metadata, permissions, and lifecycle behavior.
              Your model keeps coming back with more value as the application grows.
            </p>
            <SectionLink className="secondary-button" to="foundations">
              See how it connects
            </SectionLink>
          </div>
          <div className="jumbotron-art" aria-hidden="true">
            <img className="jumbotron-boomerang jumbotron-boomerang-purple" src="/images/boomerang_purple.png" alt="" />
            <img className="jumbotron-boomerang jumbotron-boomerang-green" src="/images/boomerang_green.png" alt="" />
            <img className="jumbotron-boomerang jumbotron-boomerang-orange" src="/images/boomerang_orange.png" alt="" />
            <span className="jumbotron-orbit orbit-one" />
            <span className="jumbotron-orbit orbit-two" />
          </div>
        </section>

        <section id="overview" className="metrics-grid">
          <article>
            <strong>Model</strong>
            <span>Define the domain once</span>
          </article>
          <article>
            <strong>Query</strong>
            <span>Express intent naturally</span>
          </article>
          <article>
            <strong>Scale</strong>
            <span>Adapt as systems evolve</span>
          </article>
        </section>

        <section id="foundations" className="feature-grid">
          <div className="feature-card">
            <img className="feature-boomerang feature-boomerang-purple" src="/images/boomerang_purple.png" alt="Purple boomerang" />
            <span className="feature-tag">01</span>
            <h3>Model your business</h3>
            <p>
              Capture entities, attributes, relationships, and inheritance in a reusable
              model that gives every part of your application the same vocabulary.
            </p>
          </div>
          <div className="feature-card">
            <img className="feature-boomerang feature-boomerang-blue" src="/images/boomerang_blue.png" alt="Blue boomerang" />
            <span className="feature-tag">02</span>
            <h3>Query with intent</h3>
            <p>
              Use a fluent, type-agnostic data API for filtering, relations, aggregation,
              and eager loading without coupling your domain to one database.
            </p>
          </div>
          <div className="feature-card">
            <img className="feature-boomerang feature-boomerang-orange" src="/images/boomerang_orange.png" alt="Orange boomerang" />
            <span className="feature-tag">03</span>
            <h3>Build dependable workflows</h3>
            <p>
              Coordinate validation, listeners, and atomic transactions so business rules
              stay close to the model and remain easy to extend.
            </p>
          </div>
        </section>

        <section id="learn" className="article-section">
          <div className="section-heading">
            <p className="eyebrow">Articles</p>
            <div className="section-heading-row">
              <h2>Learn the fundamentals</h2>
              <label className="article-search">
                <span className="sr-only">Search articles</span>
                <input
                  type="search"
                  placeholder="Search articles"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="article-grid">
              {!normalizedSearchTerm && rootEntries.folders.map((entry) => (
                <FolderCard key={entry.path} folder={entry} />
              ))}
              {(normalizedSearchTerm ? filteredArticles : rootEntries.articles).map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <p className="article-empty-state">No articles match “{searchTerm}”.</p>
          )}
        </section>
      </main>
    </div>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      className={`back-to-top${visible ? ' is-visible' : ''}`}
      type="button"
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}

function ArticlePage({ theme, onToggleTheme }) {
  const { '*': slug } = useParams()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [slug])

  const meta = articleBySlug[slug]

  if (!meta) {
    return (
      <div className="article-shell error-state">
        <h1>Article not found</h1>
        <p>The requested guide does not exist yet.</p>
        <Link className="primary-button" to="/">
          Return home
        </Link>
      </div>
    )
  }

  const currentIndex = articles.findIndex((article) => article.slug === slug)
  const previousArticle = currentIndex > 0 ? articles[currentIndex - 1] : null
  const nextArticle = currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null

  return (
    <div className="article-shell">
      <header className="article-header">
        <Link className="crumb" to={meta.folder ? `/folder/${meta.folder}` : '/'}>
          {meta.folder ? `← Back to ${folderTitle(meta.folder)}` : '← Back to overview'}
        </Link>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <article className="article-card">
        <div className="article-intro">
          <p className="eyebrow">{meta.category || 'Framework concept'}</p>
          <h1>{meta.title || 'Article'}</h1>
          <p className="article-summary-text">{meta.summary || ''}</p>
          <div className="article-meta">
            <span>{meta.readingTime || 'Article'}</span>
          </div>
        </div>

        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: meta.contentHtml || '<p>Loading article...</p>' }}
        />

        <div className="article-navigation">
          {previousArticle ? (
            <Link className="nav-card prev" to={`/article/${previousArticle.slug}`}>
              <span className="nav-card-label">Previous</span>
              <strong>{previousArticle.title}</strong>
            </Link>
          ) : (
            <span className="nav-card placeholder" />
          )}

          {nextArticle ? (
            <Link className="nav-card next" to={`/article/${nextArticle.slug}`}>
              <span className="nav-card-label">Next</span>
              <strong>{nextArticle.title}</strong>
            </Link>
          ) : (
            <span className="nav-card placeholder" />
          )}
        </div>
      </article>
      <BackToTop />
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('site-theme')
    return savedTheme || 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('site-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<FrontPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/article/*" element={<ArticlePage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/folder/*" element={<FolderPage theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </HashRouter>
  )
}

export default App
