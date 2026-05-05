type OriginRequest = {
  url: string;
  headers: {
    get(name: string): string | null;
  };
};

function getOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isSameDevelopmentLoopbackOrigin(
  leftOrigin: string,
  rightOrigin: string,
): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const left = new URL(leftOrigin);
    const right = new URL(rightOrigin);

    return (
      left.protocol === right.protocol &&
      left.port === right.port &&
      isLoopbackHost(left.hostname) &&
      isLoopbackHost(right.hostname)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string, requestOrigin: string): boolean {
  return (
    origin === requestOrigin ||
    isSameDevelopmentLoopbackOrigin(origin, requestOrigin)
  );
}

export function isSameOriginRequest(request: OriginRequest): boolean {
  const requestOrigin = getOrigin(request.url);
  if (!requestOrigin) {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return isAllowedOrigin(origin, requestOrigin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    const refererOrigin = getOrigin(referer);

    return refererOrigin
      ? isAllowedOrigin(refererOrigin, requestOrigin)
      : false;
  }

  return false;
}

export function getTrustedRequestOrigin(request: OriginRequest): string | null {
  const requestOrigin = getOrigin(request.url);
  if (!requestOrigin) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (origin && isAllowedOrigin(origin, requestOrigin)) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    const refererOrigin = getOrigin(referer);
    if (refererOrigin && isAllowedOrigin(refererOrigin, requestOrigin)) {
      return refererOrigin;
    }
  }

  return requestOrigin;
}

export function getTrustedRequestUrl(
  request: OriginRequest,
  path: string,
): URL {
  return new URL(path, getTrustedRequestOrigin(request) ?? request.url);
}
