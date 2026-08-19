import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'
import { articles, articleBySlug } from './generated/articles'
import './App.css'

function FrontPage() {
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

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark">@</span>
          <div>
            <div className="brand-name">themost</div>
            <div className="brand-sub">framework</div>
          </div>
        </div>

        <nav className="nav">
          <a href="#overview">Overview</a>
          <a href="#foundations">Foundations</a>
          <a href="#learn">Learn</a>
          <a href="https://github.com/themost-framework" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>

        <Link className="primary-button slim" to={`/article/${featuredArticle.slug}`}>
          Read the guide
        </Link>
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
              <a className="secondary-button" href="#overview">
                See the essentials
              </a>
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
            <a className="secondary-button" href="#foundations">
              See how it connects
            </a>
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
              {filteredArticles.map((article) => (
                <Link key={article.slug} className="article-card-item" to={`/article/${article.slug}`}>
                  <div className="article-card-top">
                    <span className="mini-label">{article.category}</span>
                    <span className="reading-time">{article.readingTime}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <span className="card-link">Read article →</span>
                </Link>
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

function ArticlePage() {
  const { slug } = useParams()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
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
        <Link className="crumb" to="/">
          ← Back to overview
        </Link>
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
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
