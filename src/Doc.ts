import { LamportTimestamp } from "./Lamport";
import { Block, ID, State } from "../src/types";
import { randomInt } from "crypto";

//we're not batching any blocks to keep things simple
export class Doc<T = string> {
  userId: number | string;
  clientId: number; //client id of the doc. userd for generating lamport timestamps
  items: Block<T>[]; //the list of items

  __lamportTimestamp: LamportTimestamp; //local lamport timestamp for generating local ids, & comparing 2 ids
  __length: number; //current length of the docs, does not include deleted/tombstoned items
  __start: Block<T>; //current start of the document
  __end: Block<T>; //current end of the document

  constructor(userId?: string) {
    this.userId = userId ?? "";
    this.clientId = randomInt(999999);
    this.items = [];
    this.__length = 0;
    this.__lamportTimestamp = new LamportTimestamp(this.clientId);
  }

  //convert's the value to a Block
  valueToBlock(val: T, id?: ID): Block<T> {
    return {
      id: id || this.__lamportTimestamp.id,
      value: val,
    };
  }

  //find's the node at a given index
  findNodeAtPos(index: number) {
    //if the index is greater than current existing blocks/items
    if (index > this.__length - 1) {
      throw new Error("No node at the position");
    }

    //if the index is 0 we just return start
    if (index === 0) return this.__start;

    //if index is at end we return end
    if (index === this.__length) return this.__end;

    //we loop over the linked list to find the correct item at the index and return the node

    let currentPos = 1;
    let currentNode = this.__start.right!;

    let node;
    while (currentPos <= index) {
      if (!currentNode) {
        break;
      }
      node = currentNode;
      if (currentNode?.value) currentPos++;
      currentNode = currentNode?.right!;
    }

    return node as Block<T>;
  }

  //finds a node by id
  findNodeById(nodeId: ID) {
    return this.items.filter(({ id }) => {
      return LamportTimestamp.compare(id, nodeId);
    })[0];
  }

  //Inserts an item/block to the given index
  //This is what a client/user uses to update the doc locally
  insert(index: number, value: T) {
    if (this.__length < 0) this.__length = 0;
    //if the user tries to insert at an index greater than the current document's length
    if (index > this.__length) {
      throw new Error("Invalid Operation");
    }

    //convert the value to a block
    const insertedBlock = this.valueToBlock(value);

    //if the insert is at the beginning of the document
    if (index === 0) {
      //if there is no other block present! meaning this is the first entry in the doc
      if (this.__length < 1) {
        //set the start & end as the block, since it's the first entry
        this.__start = insertedBlock;
        this.__end = insertedBlock;

        //set the length to 1 since it's the first entry
        this.__length = 1;

        //push the item to the Doc's items
        this.items.push(insertedBlock);
      } else {
        //set the current start block's left to the inserted block
        this.__start.left = insertedBlock;

        //set the right of the current block to the current Start
        insertedBlock.right = this.__start;

        //set the originRight to the start block's id
        insertedBlock.originRight = this.__start.id;

        //set the current elemnt as the starting element
        this.__start = insertedBlock;
        //increase the length of the document and push the block to Doc's items
        this.__length += 1;
        this.items.push(insertedBlock);
      }

      return;
    }

    //if the insert is at the end of the document
    if (index === this.__length) {
      //set the current end's right to the inserted block
      this.__end.right = insertedBlock;

      //set the inserted block's left & origin left to the current ending block
      insertedBlock.left = this.__end;
      insertedBlock.originLeft = this.__end.id;

      //set the inserted block as the current ending block of the document
      this.__end = insertedBlock;

      //increase the length of the document and push the block to Doc's items
      this.__length += 1;
      this.items.push(insertedBlock);

      return;
    }

    //if we're here that means, that the document is inserted between 2 blocks.

    //find the current block at the index
    const currentNodeAtPos = this.findNodeAtPos(index);

    //get the left of the node at pos
    const left = currentNodeAtPos.left;

    //change the left's right to the inserted block
    left!.right = insertedBlock;

    //change the current node at postion's left to inserted block
    currentNodeAtPos.left = insertedBlock;

    //set the insertedBloc's left to left
    insertedBlock.left = left;
    //set the insertedbllock's right to the currentNodeAtPos
    insertedBlock.right = currentNodeAtPos;

    //set the respective origins
    insertedBlock.originLeft = left!.id;
    insertedBlock.originRight = currentNodeAtPos!.id;

    //increase the length && push the element/item/block to the doc
    this.__length += 1;
    this.items.push(insertedBlock);
  }

  //deletes an item/block at a given index
  //this is what a user uses to delete an item locally
  delete(index: number) {
    //if the user tries to delete  a  block at an index greater than the current document's length
    if (index > this.__length || index < 0) {
      throw new Error("Invalid Operation");
    }

    // console.log(`start`);
    //find the node at the given index
    const nodeAtIndex = this.findNodeAtPos(index);

    // if(nodeAtIndex)

    // console.log(`end`);
    //set the value to undefined & reduce the length
    nodeAtIndex.value = undefined;
    this.__length -= 1;
  }

  //returns the current value of the document
  toString() {
    // console.log(this.simpleDoc());
    let str = (this.__start?.value ?? "") as string;

    let right = this.__start?.right;

    while (true) {
      if (!right) break;

      str += right.value ?? ("" as string);

      right = right.right;
    }

    return str;
  }

  printSimpleDoc() {
    this.items.map((item) => {
      console.log({
        id: item.id,
        value: item.value,
        originLeft: item.originLeft,
        originRight: item.originRight,
        left: {
          id: item.left?.id,
          value: item.left?.value,
        },
        right: {
          id: item.right?.id,
          value: item.right?.value,
        },
      });
    });
  }

  //create a merge function
  //create a getState function
  getState(): State<T>[] {
    const items: Block<T>[] = [];
    this.items.forEach((item) => {
      items.push({
        id: item.id,
        originRight: item.originRight,
        originLeft: item.originLeft,
        value: item.value,
      });
    });

    return items;
  }

  canInsert = (block: Block<T>) => {
    const origin = this.findNodeById(block.originLeft!);
    const originRight = this.findNodeById(block.originRight!);
    if (block.originLeft && !origin) return false;
    if (block.originRight && !originRight) return false;

    const node = this.findNodeById(block.id);

    if (node) return false;
    return true;
  };

  findChanges(state: Block<T>[]) {
    const unseenUpdates: Block<T>[] = [];
    const newDeletes: Block<T>[] = [];

    //remote state's map
    state.map((block) => {
      const item = this.items.find((item) => {
        return LamportTimestamp.compare(item.id, block.id);
      });

      if (item) {
        if (item.value !== block.value) newDeletes.push(item);
      } else {
        unseenUpdates.push(block);
      }
    });

    return { unseenUpdates, newDeletes };
  }

  buildBlock(block: State<T>): Block<T> {
    return {
      ...block,
    };
  }

  //merge with a remote/other Doc's state
  merge(remoteState: State<T>[]) {
    const { newDeletes, unseenUpdates } = this.findChanges(remoteState);

    //* loop over all new updates
    for (let item of unseenUpdates) {
      const newItem = this.buildBlock(item);

      //if we can't insert now skip
      if (!this.canInsert(newItem)) {
        //   pendingUpdates.push(newItem);
        continue;
      }

      //if this is the first insert, on a empty doc
      if (this.__length < 1) {
        this.__start = newItem;
        this.__end = newItem;
        this.__length += 1;
        this.items.push(newItem);
        continue;
      }

      //find the parent origins
      const ol = this.findNodeById(newItem.originLeft!);
      const or = this.findNodeById(newItem.originRight!);

      //set the left to the current parent
      //we will use this as pointer after which we want to insert
      let left = ol;

      //item inserted at start [no conflicts version]
      if (!ol && or === this.__start) {
        // console.log(`start insettion  ${newItem.value}  ${this.userId}`);
        const right = this.__start;
        this.__start = newItem;
        newItem.right = right;

        right.left = newItem;

        this.items.push(newItem);
        this.__length += 1;
        continue;
      }

      //item inserted at end! [no conflicts version]
      if (!or && ol === this.__end) {
        if (newItem.right?.value) {
          console.log(newItem.right?.value);
        }
        // console.log(
        //   `end insertion ${newItem.value}  ${this.userId} ${newItem.right?.value}`
        // );
        const left = this.__end;
        this.__end = newItem;

        newItem.left = left;
        left.right = newItem;

        this.items.push(newItem);
        this.__length += 1;
        continue;
      }

      //this is a conflicting update
      //case 1 -> if the parent (origin left) is there && parent's right is not equal to the (origin right). that means this update was not aware of the parent's right so a conflicting update
      //case 2 ->
      //  if both parents are not defined. please note that we already took care if the update was on a empty document in the beginning of this funciton
      // so not having both parents will be conflicting update
      // if origin left is not defined and origin right 's current left is not defined. that means this update was not aware of the current left. so a conflicting update
      if ((ol && ol.right !== or) || (!ol && (!or || or.left !== undefined))) {
        // console.log(`conflicting! -> ${newItem.value}  ${this.userId}`);

        //we use this variable to loop over our linkedlist
        let o;

        //set o to the first conflicting item
        if (left) {
          o = left.right;
        } else {
          o = this.__start;
        }

        //current counter of conflicting blocks
        const conflictingCounter = new Set();

        //all the blocks that we've seen after the origin and before the origin right
        const seen = new Set();

        while (o !== undefined) {
          if (!o) break;
          if (LamportTimestamp.compare(o.id, or?.id)) break;
          //check now?
          //This is going to be all the items from you originLeft to the actual left where you want to insert the item
          seen.add(o);

          //this is used to track current iteration of conflicting items
          conflictingCounter.add(o);

          //if they have the same parent
          if (LamportTimestamp.compare(o?.originLeft, newItem.originLeft)) {
            // console.log(`same parent `);

            //if they both have same origin left and same origin right
            //and the newItem has a greater id , then we break and insert
            if (
              newItem.id[0] > o!.id[0] &&
              LamportTimestamp.compare(newItem!.originRight, o.originRight)
            )
              break;

            //else they might have a smaller id or a diffferent right origin,
            //but due to same origin left. we mark the current item as the left and clear the conflict counter
            if (newItem.id[0] < o!.id[0]) {
              left = o!;
              conflictingCounter.clear();
            }
          }

          //if they don't have the same origin but they are still within our origin left
          else if (
            o!.originLeft &&
            seen.has(this.findNodeById(o!.originLeft!))
          ) {
            //if we have seen the items's origin left/ and the parent was cleared from conflicting set. we also want to skip this item as well
            //because we come to the right hand side of this.
            if (!conflictingCounter.has(this.findNodeById(o!.originLeft!))) {
              //   console.log(`hey i'm being called? ${o.value}`);
              left = o!;
              conflictingCounter.clear();
            }
          }
          //reaching this point, where the block/item does not have the same origin left and also the origin left is not within the new item's origin left. we break
          else {
            break;
          }
          o = o!.right;
        }

        // if()
      }

      //   if (
      //     this.userId === "doc1" &&
      //     (newItem.value === "1" ||
      //       newItem.value === "A" ||
      //       newItem.value === "Q")
      //   ) {
      //     // console.log(`${newItem.value}  -> ${left?.value}`);
      //   }

      if (left) {
        let right = left.right;
        left.right = newItem;
        newItem.left = left;
        if (right) {
          newItem.right = right;
          right.left = newItem;
        } else {
          //   console.log(`end is ${newItem.value}`);
          this.__end = newItem;
        }

        this.items.push(newItem);
        this.__length += 1;
      } else {
        // console.log(`bomb`);
        let right = this.__start;
        this.__start = newItem;
        newItem.right = right;
        right.left = newItem;

        this.items.push(newItem);
        this.__length += 1;
      }
    }

    for (let block of newDeletes) {
      //@ts-ignore
      if (block.value) {
        const node = this.findNodeById(block.id);

        //@ts-ignore
        if (node && node.value && node.value.length > 0) {
          //merge deletes
          this.__length -= 1;
          block.value = undefined;
        }
      }
    }
  }
}
