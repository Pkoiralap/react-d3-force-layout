# react-d3-force-layout
Using d3 with react is hard enough. This package will help users around the globe to use d3 force layout with react.

### Demo
Find the basic demo [here](https://codesandbox.io/s/react-playground-forked-97ppjd?file=/index.js)

to install

    npm install react-d3-force-layout

to use

    import ForceLayout from 'react-d3-force-layout';

FORMAT OF DATA TO FEED IN


   
    const graphData = {
        nodes: [
            {id: 'GrandFather',showChildren: true,show: true,group: 1},
            {id: 'Father1',showChildren: true,show: true,group: 2},
            {id: 'Father2',showChildren: true,show: true,group: 2},
            {id: 'Father3',showChildren: true,show: true,group: 2},
            {id: 'Father4',showChildren: true,show: true,group: 2},
            {id: 'Father5',showChildren: true,show: true,group: 2},
            {id: 'Father6',showChildren: true,show: true,group: 2},
            {id: 'Father7',showChildren: true,show: true,group: 2},
            {id: 'Father8',showChildren: true,show: true,group: 2},
            {id: 'Son1',showChildren: true,show: true,group: 3},
            {id: 'Son2',showChildren: true,show: true,group: 3},
            {id: 'Son3',showChildren: true,show: true,group: 3},
            {id: 'Son4',showChildren: true,show: true,group: 3},
            {id: 'Son5',showChildren: true,show: true,group: 3},
            {id: 'Son6',showChildren: true,show: true,group: 3},
            {id: 'Son7',showChildren: true,show: true,group: 3},
            {id: 'Son8',showChildren: true,show: true,group: 3},
            {id: 'Son9',showChildren: true,show: true,group: 3},
            {id: 'Son10',showChildren: true,show: true,group: 3},
            {id: 'Son11',showChildren: true,show: true,group: 3},
            {id: 'Son12',showChildren: true,show: true,group: 3},
            {id: 'Son13',showChildren: true,show: true,group: 3},
            {id: 'Son14',showChildren: true,show: true,group: 3},
            {id: 'Son15',showChildren: true,show: true,group: 3},
            {id: 'Son16',showChildren: true,show: true,group: 3},
        ],
        links: [
            {source: 'GrandFather', show: true, target: 'Father1', value: 5},
            {source: 'GrandFather', show: true, target: 'Father2', value: 5},
            {source: 'GrandFather', show: true, target: 'Father3', value: 5},
            {source: 'GrandFather', show: true, target: 'Father4', value: 5},
            {source: 'GrandFather', show: true, target: 'Father5', value: 5},
            {source: 'GrandFather', show: true, target: 'Father6', value: 5},
            {source: 'GrandFather', show: true, target: 'Father7', value: 5},
            {source: 'GrandFather', show: true, target: 'Father8', value: 5},
            {source: 'Father1', show: true, target: 'Son1', value: 12},
            {source: 'Father1', show: true, target: 'Son3', value: 12},
            {source: 'Father2', show: true, target: 'Son2', value: 9},
            {source: 'Father2', show: true, target: 'Son4', value: 3},
            {source: 'Father3', show: true, target: 'Son5', value: 3},
            {source: 'Father3', show: true, target: 'Son7', value: 3},
            {source: 'Father4', show: true, target: 'Son6', value: 3},
            {source: 'Father4', show: true, target: 'Son8', value: 3},
            {source: 'Father5', show: true, target: 'Son9', value: 3},
            {source: 'Father5', show: true, target: 'Son10', value: 3},
            {source: 'Father6', show: true, target: 'Son11', value: 3},
            {source: 'Father6', show: true, target: 'Son12', value: 3},
            {source: 'Father7', show: true, target: 'Son13', value: 3},
            {source: 'Father7', show: true, target: 'Son14', value: 3},
            {source: 'Father8', show: true, target: 'Son15', value: 3},
            {source: 'Father8', show: true, target: 'Son16', value: 3},
        ],
    };

USING INSIDE RENDER:
ForceLayout takes the width and height of its immediate parent div


    <div style={{boxShadow: '2px 2px 1px 2px', height: '90%', width: '100%', position: 'absolute'}}>
        <ForceLayout
            nodeLinkObject={JSON.parse(JSON.stringify(graphData))} // primary prop
            colorFunction={node => ( {1: 'red', 2: 'green', 3: 'purple'}[node.group] )}
            multiOptionsClick={{
                keyToLookFor: 'group', // based on what keys the functions are to be given
                2: { // group with number 2 has a single function called create and is collapsible
                  Create: {
                    func: node => {
                      console.log('create clicked on node', node)
                    },
                    color: '#C64944',
                  },
                },
                3: { // group with number 3 has 2 functions and is not collapsible
                  Edit: {
                    func: node => {
                      console.log('edit Clicked on node', node);
                    },
                    color: '#E76C32',
                  },
                  Delete: {
                    func: node => {
                      console.log('delete clicked on node', node);
                    },
                    color: '#8571AB',
                  },
                },
                collapsibles: [1, 2], // nodes with keyToLookFor value these will include auto collapse option
            }}
            // collapseOnClick // if multiOptionClick not set and this prop enabled , all nodes will be collapsible
            nodeClicked={() => {}} // works when multiOptionClick and collapseOnClick not set
            showLabelOnHover={{ // if set a tooltip shows if not the nodes are labled by default by name or id
                id: 'ID-modified',
                group: 'Type',
            }}
            legend={{ GrandFather: 'red', Father: 'green', Son: 'purple'}}
            connectionStrength={0.09} // the more the value the lesser closely the nodes are packed
            circleIncreseFactor={15} // increase per increase in group
            circleRadius={5} // the base circle radius
            treeView={false} // put this true to see tree view
            // treeView
            fillType="white" // "white" or according to the color function
        />   
    </div>
