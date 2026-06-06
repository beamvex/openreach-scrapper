export interface s3Parts {
  key: string;
  street?: string;
  postcode1?: string;
  postcode2?: string;
  united?: string;
  kingdom?: string;
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
  millisecond?: string;
}

export interface timeAndLocation {
  key: string;
  time: Date;
  postcode: string;
}

export function parseS3Key(key: string): s3Parts {
  const regex =
    /openreach\/(?<street>[^/]+)_(?<postcode1>[^/]+)_(?<postcode2>[^/]+)\.html/;
  const match = key.match(regex);

  return {
    key,
    ...match?.groups,
  };
}

export function convertS3KeyToTimeAndLocation(parts: s3Parts): timeAndLocation {
  return {
    key: parts.key,
    time: new Date(
      parseInt(parts.year ?? '0'),
      parseInt(parts.month ?? '0') - 1,
      parseInt(parts.day ?? '0'),
      parseInt(parts.hour ?? '0'),
      parseInt(parts.minute ?? '0'),
      parseInt(parts.second ?? '0'),
      parseInt(parts.millisecond ?? '0')
    ),
    postcode: `${parts.postcode1} ${parts.postcode2}`,
  };
}
