import React from 'react';
import {readFile} from 'node:fs/promises';import {join} from 'node:path';import {ImageResponse} from '@vercel/og';
const routeDir=join(process.cwd(),'runtime/og');
const TITLE_MAX_LENGTH = 140;
const DESCRIPTION_MAX_LENGTH = 320;

const clamp = (value: string | null, maxLength: number) =>
  value === null ? null : value.slice(0, maxLength);

// The query-param card is a pure function of its URL (copy changes change
// the URL), so browsers may cache it forever.
const IMMUTABLE_CACHE_CONTROL =
  'public, immutable, no-transform, max-age=31536000';
// The slug card's URL stays stable when a page's title changes: let the
// CDN cache it (deploys purge that) but make browsers revalidate.
const REVALIDATED_CACHE_CONTROL =
  'public, max-age=0, must-revalidate, no-transform, s-maxage=31536000';

/** Static card assets, read once per server process. */
let assetsPromise: Promise<{
  regularFont: Buffer;
  semiboldFont: Buffer;
  backgroundImageData: ArrayBuffer;
}> | null = null;

const loadAssets = () => {
  assetsPromise ??= (async () => {
    const [regularFont, semiboldFont, backgroundImage] = await Promise.all([
      readFile(join(routeDir, 'geist-sans-regular.ttf')),
      readFile(join(routeDir, 'geist-sans-semibold.ttf')),
      readFile(join(routeDir, 'background.png')),
    ]);
    return {
      regularFont,
      semiboldFont,
      backgroundImageData: backgroundImage.buffer.slice(
        backgroundImage.byteOffset,
        backgroundImage.byteOffset + backgroundImage.byteLength,
      ) as ArrayBuffer,
    };
  })();
  return assetsPromise;
};

export const renderCard = async (
  title: string | null,
  description: string | null,
  cacheControl: string,
) => {
  const { regularFont, semiboldFont, backgroundImageData } = await loadAssets();

  return new ImageResponse(
    <div style={{ fontFamily: 'Geist Sans' }} tw="flex h-full w-full bg-black">
      {/* Satori requires a plain img element. */}
      <img
        alt="Vercel OpenGraph Background"
        height={628}
        src={backgroundImageData as never}
        width={1200}
      />
      <div tw="flex flex-col absolute h-full w-[750px] justify-center left-[50px] pr-[50px] pt-[116px] pb-[166px]">
        <div
          style={{
            textWrap: 'balance',
            fontWeight: 500,
            fontSize: title && title.length > 20 ? 64 : 80,
            letterSpacing: '-0.06em',
          }}
          tw="text-zinc-50 tracking-tight flex-grow-1 flex flex-col justify-center leading-[1.1]"
        >
          {title}
        </div>
        <div
          style={{
            color: '#8B8B8B',
            lineHeight: '56px',
            textWrap: 'balance',
          }}
          tw="text-[40px]"
        >
          {description}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 628,
      headers: {
        'Cache-Control': cacheControl,
      },
      fonts: [
        {
          name: 'Geist Sans',
          data: regularFont,
          weight: 400,
        },
        {
          name: 'Geist Sans',
          data: semiboldFont,
          weight: 500,
        },
      ],
    },
  );
};

