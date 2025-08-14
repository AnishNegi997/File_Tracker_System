import React from "react";

const Table = ({ columns, data, renderActions }) => (
  <div className="table-responsive">
    <table className="table table-hover align-middle">
      <thead className="table-dark">
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
          {renderActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (renderActions ? 1 : 0)} className="text-center">No data</td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              {renderActions && <td>{renderActions(row)}</td>}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Table; 