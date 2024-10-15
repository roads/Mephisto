function formatEvent({
  kind,
  agent,
  optional_data = {},
  optional_meta = {},
} = {}) {
  const date = new Date();
  const formattedData = {
    kind: kind,
    agent: agent,
    timestamp_iso: date.toISOString(),
    timestamp_local: date.toString(),
    ...optional_data,
  };
  const event = {
    meta: optional_meta,
    data: formattedData,
  };
  return event;
}

export default formatEvent;
