import { convertS3KeyToTimeAndLocation, parseS3Key } from './utils';

describe('utils', () => {
  it('parse s3 key', () => {
    const astring =
      'openreach/1_Back_Lane_Dunston_Lincoln_LN4_2EH_United_Kingdom-2025-12-23T16-18-34-587Z.html';

    const match = parseS3Key(astring);

    expect(match).toBeDefined();
    expect(match).toMatchObject({
      street: '1_Back_Lane_Dunston_Lincoln',
      postcode1: 'LN4',
      postcode2: '2EH',
      united: 'United',
      kingdom: 'Kingdom',
      year: '2025',
      month: '12',
      day: '23',
      hour: '16',
      minute: '18',
      second: '34',
      millisecond: '587',
    });
  });

  it('converts', () => {
    const timeAndLocation = convertS3KeyToTimeAndLocation({
      street: '1_Back_Lane_Dunston_Lincoln',
      postcode1: 'LN4',
      postcode2: '2EH',
      united: 'United',
      kingdom: 'Kingdom',
      year: '2025',
      month: '12',
      day: '23',
      hour: '16',
      minute: '18',
      second: '34',
      millisecond: '587',
    });
    expect(timeAndLocation).toBeDefined();
    expect(timeAndLocation).toMatchObject({
      time: new Date('2025-12-23T16:18:34.587Z'),
      postcode: 'LN4 2EH',
    });
  });
});
