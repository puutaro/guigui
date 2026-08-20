
export const filterListItems = (
    bodyItems: string[],
    searchQuery: string, 
    configDelimiter: string | undefined,
    configWithNth: number | undefined,
): string[] => {
    let filteredBodyItems = bodyItems; 
    if (searchQuery.length <= 0) return filteredBodyItems;
      let delimiter = "";
      if(
        (configDelimiter && configDelimiter.length > 0)
      ){
        delimiter = configDelimiter
      }
      let withNth = -1;
      if(
        (configWithNth && configWithNth >= 0)
      ){
        withNth = configWithNth
      }
    const lowerSQuery = searchQuery.toLowerCase();
    return bodyItems.filter((item) =>{
      let searchItem = item
      if(
        withNth >= 0 &&
        delimiter.length > 0
      ){
        searchItem = item.split(delimiter)[withNth] ?? item
      }
      let curIndex = -1;
      for (const  char of lowerSQuery) {
        const charIndex = searchItem.toLowerCase().indexOf(char, curIndex + 1);
        if(charIndex <= curIndex  || charIndex === -1){
          return false
        }
        curIndex = charIndex;
      }
      return true
    }).map((item) => {
      let searchItem = item
      if(
        withNth >= 0 &&
        delimiter.length > 0
      ){
        searchItem = item.split(delimiter)[withNth] ?? item
      }
      let curIndex = -1;
      let point = 0;
      for (const  char of lowerSQuery) {
        const charIndex = searchItem.toLowerCase().indexOf(char, curIndex + 1);
        if(curIndex !== -1){
          point += charIndex - curIndex;
        }
        curIndex = charIndex;
      }
      return {
          pointKey: point,
          itemKey: item,
        }
    }).sort((p1, p2) => p1.pointKey - p2.pointKey)
    .map(obj => obj.itemKey
    );
  }