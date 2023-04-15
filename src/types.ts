//* This is a lamport timestamp. we will not store a global counter like RGA, but instead one clock for each client
export type ID = [number, number];

export interface Block<T> {
  id: ID; //* the id of the block
  originLeft?: ID; //* the id of the parent/left block, during the time of creation
  originRight?: ID; //* the id of the next/right block , during the time of creation

  left?: Block<T>; //* the current parent/left block
  right?: Block<T>; //* the current next/right block

  value?: T; //* value of the item,  undefined in case the object was deleted
}

export interface State<T> {
  id: ID; //* the id of the block
  originLeft?: ID; //* the id of the parent/left block, during the time of creation
  originRight?: ID; //* the id of the next/right block , during the time of creation

  value?: T; //* value of the item,  undefined in case the object was deleted
}
