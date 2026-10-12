
import "../../components/dashboard/dashboard.css";

type StatusFilter = "all" | "published" | "draft";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
};

export default function DashboardToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  
}: Props) {
  return (
    <section className="dashboard-toolbar" aria-label="Dashboard controls">
  <div className="dashboard-toolbar-left">
    

    <div className="field">
      <label className="label" htmlFor="dashboard-search">Search</label>
      <input
        id="dashboard-search"
        className="input dashboard-search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Title, ID, or public slug"
        type="search"
        autoComplete="off"
      />
    </div>

    <div className="field">
      <label className="label" htmlFor="dashboard-filter">Status</label>
      <select
        id="dashboard-filter"
        className="select"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as any)}
      >
        <option value="all">All</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
    </div>
  </div>


    </section>
  );
}
