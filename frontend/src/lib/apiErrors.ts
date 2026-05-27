import { NextResponse } from 'next/server';

export function serverConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Server configuration error';

  return NextResponse.json(
    {
      error: 'server_configuration_error',
      message,
    },
    { status: 503 },
  );
}
