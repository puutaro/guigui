import {makeDisplayText} from "./libs/makeDisplayText";

export const filterListItemObjs = (
    bodyItems: string[],
    searchQuery: string, 
    configDelimiter: string,
    configWithNth: number,
): {
  lineKey: string;
  nthKey: string,
  matchedIndex: number[];
}[] => {
    if (searchQuery.length <= 0) {
      return bodyItems.map((line)=>{
        return {
          lineKey: line,
          nthKey: makeDisplayText(line, configDelimiter, configWithNth),
          matchedIndex: [],
        }
      })
    }
      let delimiter = "";
      if(
        (configDelimiter.length > 0)
      ){
        delimiter = configDelimiter
      }
      let withNth = -1;
      if(
        (configWithNth >= 0)
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
        searchItem = item.split(delimiter)[withNth] ?? ""
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
    }).map((line) => {
      let searchItem = line
      if(
        withNth >= 0 &&
        delimiter.length > 0
      ){
        searchItem = line.split(delimiter)[withNth] ?? line
      }
      let curIndex = -1;
      let point = 0;
      let matchedIndexes:  number[] = []
      for (const char of lowerSQuery) {
        const charIndex = searchItem.toLowerCase().indexOf(char, curIndex + 1);
        if (charIndex !== -1) {
          // ★ 1文字目も含めて常に見つかったインデックスを追加する
          matchedIndexes.push(charIndex);
          if (curIndex !== -1) {
            point += charIndex - curIndex;
          }
        }
        curIndex = charIndex;
      }
      return {
          pointKey: point,
          lineKey: line,
          nthKey: searchItem,
          matchedIndex: matchedIndexes,
        }
    }).sort((p1, p2) => p1.pointKey - p2.pointKey)
        .map((obj) =>{
          return {
            lineKey: obj.lineKey,
            nthKey: obj.nthKey,
            matchedIndex: obj.matchedIndex,
          }
        })
  }