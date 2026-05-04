import { Link } from '@tanstack/react-router'
import { useLinks } from '@entities/link'
import { useApps } from '@entities/app'
import { useEvents } from '@entities/event'
import { Card, PageHeader, Stat, Badge, Spinner } from '@shared/ui'
import { useSession } from '@entities/session'
import { formatNumber, formatDate } from '@shared/lib'
import { EventsTimeline, EventTypeDonut, TopLinksBar } from './charts'
import './dashboard.css'

export function DashboardPage() {
  const user = useSession((s) => s.user)
  const links = useLinks({ limit: 5, offset: 0 })
  const topLinks = useLinks({ limit: 50, offset: 0 })
  const apps = useApps()
  const events = useEvents({ limit: 8, offset: 0 })
  const eventsForCharts = useEvents({ limit: 500, offset: 0 })

  const totalClicks =
    links.data?.items.reduce((s, l) => s + (l.stats?.clicks ?? 0), 0) ?? 0
  const totalInstalls =
    links.data?.items.reduce((s, l) => s + (l.stats?.installs ?? 0), 0) ?? 0
  const totalConversions =
    links.data?.items.reduce((s, l) => s + (l.stats?.conversions ?? 0), 0) ?? 0

  return (
    <>
      <PageHeader
        title={`Welcome${user ? `, ${user.username}` : ''}`}
        description="Overview of your dynamic links workspace."
      />

      <div className="dash__stats">
        <Stat
          label="Total links"
          value={formatNumber(links.data?.total)}
          tone="primary"
        />
        <Stat
          label="Apps"
          value={formatNumber(apps.data?.length)}
          tone="neutral"
        />
        <Stat
          label="Recent clicks"
          value={formatNumber(totalClicks)}
          hint="Top 5 links"
          tone="success"
        />
        <Stat
          label="Recent installs / conv."
          value={`${formatNumber(totalInstalls)} / ${formatNumber(totalConversions)}`}
          tone="warning"
        />
      </div>

      <div className="dash__row dash__row--charts">
        <Card title="Events — last 14 days" description="Daily activity by event type">
          {eventsForCharts.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <EventsTimeline events={eventsForCharts.data?.items ?? []} />
          )}
        </Card>

        <Card title="Event mix" description="Distribution by event type">
          {eventsForCharts.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <EventTypeDonut events={eventsForCharts.data?.items ?? []} />
          )}
        </Card>
      </div>

      <Card title="Top links by clicks" description="Highest-traffic short codes" className="dash__top-links">
        {topLinks.isLoading ? (
          <div style={{ padding: 24 }}>
            <Spinner />
          </div>
        ) : (
          <TopLinksBar links={topLinks.data?.items ?? []} />
        )}
      </Card>

      <div className="dash__row">
        <Card
          title="Recent links"
          actions={
            <Link to="/links" className="dash__link">
              View all →
            </Link>
          }
          padding="none"
        >
          {links.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <ul className="dash__list">
              {links.data?.items.map((l) => (
                <li key={l.id}>
                  <Link to="/links/$shortCode" params={{ shortCode: l.short_code }}>
                    <code>{l.short_code}</code>
                  </Link>
                  <span className="dash__list-meta">{l.deep_link}</span>
                  <span className="dash__list-stat">
                    {formatNumber(l.stats?.clicks)} clicks
                  </span>
                </li>
              ))}
              {links.data?.items.length === 0 && (
                <li className="dash__empty">No links yet</li>
              )}
            </ul>
          )}
        </Card>

        <Card
          title="Recent events"
          actions={
            <Link to="/events" className="dash__link">
              View all →
            </Link>
          }
          padding="none"
        >
          {events.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <ul className="dash__list">
              {events.data?.items.map((e, i) => (
                <li key={i}>
                  <Badge
                    tone={
                      e.type === 'install'
                        ? 'success'
                        : e.type === 'click'
                          ? 'info'
                          : e.type === 'conversion'
                            ? 'primary'
                            : 'neutral'
                    }
                  >
                    {e.type}
                  </Badge>
                  <span className="dash__list-meta">link #{e.link_id}</span>
                  <span className="dash__list-stat">{formatDate(e.occurred_at)}</span>
                </li>
              ))}
              {events.data?.items.length === 0 && (
                <li className="dash__empty">No events yet</li>
              )}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
