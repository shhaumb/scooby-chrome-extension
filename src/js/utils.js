export function escapeString(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function escapeValue(v) {
  if ((typeof v) === 'string') {
    return escapeString(v);
  }
  return v;
}

export function asTupleString(args) {
  return `(${args.map(escapeValue).join(', ')})`;
}

export function getGeneralData(request, response) {
  return [
    {
      name: 'Request URL',
      value: request.url,
    },
    {
      name: 'Request Method',
      value: request.method,
    },
  ];
}

export function startsWith(string, sub) {
  if (sub !== undefined) {
    return string.substring(0, sub.length) === sub;
  }
  return false;
}

export function getDomain(url) {
  if (startsWith(url, 'https')) {
    return `https://${url.substring(8).split('/')[0]}`;
  } else if (startsWith(url, 'http')) {
    return `http://${url.substring(7).split('/')[0]}`;
  }
  return url.split('/')[0];
}

export function removeProtocol(domain) {
  return domain.replace(/(^\w+:|^)\/\//, '');
}

export function getUrlAfterDomain(url) {
  const domain = getDomain(url);
  return url.substring(domain.length);
}

export function getScoobyDataUrl(domain, uuid) {
  return `${domain}/scooby/get-data/${uuid}/`;
}

export function getScoobyCProfileDataUrl(domain, uuid, filename) {
  return `${domain}/scooby/get-cprofile-data/${uuid}/?filename=${filename}`;
}
