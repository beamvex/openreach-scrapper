export interface s3Parts {
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
  time: Date;
  postcode: string;
}

export function parseS3Key(key: string): s3Parts {
  const regex =
    /openreach\/(?<street>[^/]+)_(?<postcode1>[^/]+)_(?<postcode2>[^/]+)_(?<united>[^/]+)_(?<kingdom>[^/]+)-(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})T(?<hour>[0-9]{2})-(?<minute>[0-9]{2})-(?<second>[0-9]{2})-(?<millisecond>[0-9]{3})Z\.html/;
  const match = key.match(regex);

  return match?.groups ?? ({} as s3Parts);
}

export function convertS3KeyToTimeAndLocation(parts: s3Parts): timeAndLocation {
  return {
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
