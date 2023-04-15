import { Doc } from "./Doc";

// a textcrdt implementation

const mergeDocs = (docs: Doc[]) => {
  for (let doc of docs) {
    const state = doc.getState();
    for (let doc of docs) {
      doc.merge(state);
    }
  }
};

// const insertAndMerge = ({index, value, doc,docs}: {index: number, value: string , doc: Doc, docs: Doc[] }) => {

// }

const doc1 = new Doc("doc1");
const doc2 = new Doc("doc2");
const doc3 = new Doc("doc1");
const doc4 = new Doc("doc2");

const alphanumeric: string[] = [
  "0",
  "1",
  "2",
  " ",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const getRandNumTill = (till: number) => Math.floor(Math.random() * till);

//deletes and inserts and merges some docs randomly
const randomBoxer = (count = 50) => {
  try {
    const allDocs = [doc1, doc2, doc3, doc4];

    for (let i = 0; i < count; i++) {
      //to confirm algorithm is not in a circular loop
      // if (i % 100 === 0) {
      //   console.log(`${i} is divisible by 100.`);
      // }
      const currDocIndex = getRandNumTill(allDocs.length);
      const currDOC = allDocs[currDocIndex];

      const deleteOrInsert = getRandNumTill(5);

      let insertOrDeleteIndex = getRandNumTill(currDOC.__length - 1);

      if (insertOrDeleteIndex < 0) insertOrDeleteIndex = 0;
      if (deleteOrInsert > 2) {
        currDOC.insert(
          insertOrDeleteIndex,
          alphanumeric[getRandNumTill(alphanumeric.length - 1)]
        );
      } else {
        if (insertOrDeleteIndex === 0 && currDOC.__length < 2) continue;
        // console.log(`deleting?  how many?`);
        currDOC.delete(insertOrDeleteIndex);
      }

      if (getRandNumTill(100) <= 2) {
        const docRand1 = allDocs[getRandNumTill(allDocs.length - 1)];
        const docRand2 = allDocs[getRandNumTill(allDocs.length - 1)];

        mergeDocs([currDOC, docRand1, docRand2]);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

randomBoxer(500);

mergeDocs([doc1, doc2, doc3, doc4]);

console.log(`done`);
console.log(doc1.toString() === doc2.toString());
console.log(doc2.toString() === doc3.toString());
console.log(doc3.toString() === doc4.toString());
console.log(doc1.toString());
console.log(doc2.toString());
console.log(doc3.toString());
console.log(doc4.toString());

// doc1.insert(0, "A");
// doc1.insert(1, "B");
// doc1.insert(2, "C");
// doc1.insert(3, "D");
// doc1.insert(4, "E");
// doc1.insert(5, "F");

// doc2.insert(0, "1");
// doc2.insert(1, "2");
// doc2.insert(2, "3");
// doc2.insert(3, "4");
// doc2.insert(4, "5");
// doc2.insert(5, "6");

// mergeDocs([doc1, doc2, doc3]);

// console.log(`${doc1.toString()}  -> ${doc1.userId}`); //either A B C D E F 1 2 3 4 5 6  'OR' 1 2 3 4 5 6 A B C D E F

// console.log(`${doc2.toString()}  -> ${doc2.userId}`);

// console.log(`${doc3.toString()}  -> ${doc3.userId}`);

// doc4.insert(0, "G");
// doc4.insert(1, "G");

// doc2.delete(1);
// doc3.delete(2);

// mergeDocs([doc1, doc2, doc3, doc4]);

// console.log(`${doc1.toString()}  -> ${doc1.userId}`);

// console.log(`${doc2.toString()}  -> ${doc2.userId}`);

// console.log(`${doc3.toString()}  -> ${doc3.userId}`);

// doc1.insert(0, "A");
// doc1.insert(1, "E");

// mergeDocs([doc1, doc2, doc3, doc4]);

// doc1.insert(1, "B");

// mergeDocs([doc1, doc2]); // ABE

// doc1.insert(2, "K");
// doc1.insert(3, "L");
// doc2.insert(2, "M");
// console.log(doc1.toString());

// console.log(doc2.toString());
// mergeDocs([doc1, doc2]); //ABKLME

// doc4.insert(1, "X");

//A B                        E {B}
//B has same parent will be marked as left, because it has smaller id {} left = b
// A B K                    E   {K}
// K does not have same origin, but has the parent in inserSet  {} left = k
// A B K L                   E  {L}
// L does not have same origin, but has has paren tin insertSet.

// if (
//   doc1.toString() !== doc2.toString() ||
//   doc2.toString() !== doc3.toString() ||
//   doc3.toString() !== doc4.toString()
// ) {
//   console.log(doc1.items);
//   console.log(doc2.items);
//   console.log(doc3.items);
//   console.log(doc4.items);
//   console.log(`--------------------------doc1`);
//   doc1.printSimpleDoc();

//   console.log(`--------------------------doc1`);

//   console.log(`--------------------------doc2`);
//   doc2.printSimpleDoc();

//   console.log(`--------------------------doc2`);

//   console.log(`--------------------------doc3`);
//   doc3.printSimpleDoc();

//   console.log(`--------------------------doc3`);

//   console.log(`--------------------------doc4`);
//   doc4.printSimpleDoc();

//   console.log(`--------------------------doc4`);
// }

// insertAndMerge({index: 0, })
