describe('random', () => {
  it('should pass', () => {
    const astring =
      'openreach/1_Back_Lane_Dunston_Lincoln_LN4_2EH_United_Kingdom-2025-12-23T16-18-34-587Z.html';

    const regex =
      /openreach\/(?<street>[^/]+)_(?<postcode1>[^/]+)_(?<postcode2>[^/]+)_(?<united>[^/]+)_(?<kingdom>[^/]+)-(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})T(?<hour>[0-9]{2})-(?<minute>[0-9]{2})-(?<second>[0-9]{2})-(?<millisecond>[0-9]{3})Z\.html/;
    const match = astring.match(regex);
    console.log(match);

    expect(true).toBe(true);
  });
});
