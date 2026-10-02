export function PermissionGroups({
  permissions,
  selected,
  onChange,
  disabled = false,
}: {
  permissions: string[];
  selected: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}) {
  const groups = [...new Set(permissions.map((p) => p.split('.')[0]))];
  return (
    <div className="permission-groups">
      {groups.map((group) => (
        <fieldset key={group} disabled={disabled}>
          <legend>{group}</legend>
          {permissions
            .filter((p) => p.split('.')[0] === group)
            .map((permission) => (
              <label key={permission} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selected.includes(permission)}
                  disabled={!onChange || disabled}
                  onChange={(e) =>
                    onChange?.(
                      e.target.checked ? [...selected, permission] : selected.filter((p) => p !== permission),
                    )
                  }
                />
                <span>{permission.split('.').slice(1).join(' / ') || permission}</span>
              </label>
            ))}
        </fieldset>
      ))}
    </div>
  );
}
