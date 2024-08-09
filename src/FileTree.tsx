import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { getUserConfig } from './utils';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { Box } from '@mui/material';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';

interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileNode[];
}

const FileTree: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TreeViewBaseItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const config = await getUserConfig();
        const fileTree: FileNode[] = await invoke('get_file_tree', { pathString: config.workspace_dir });

        const buildItems = (nodes: FileNode[]): TreeViewBaseItem[] => {
          return nodes.map(node => ({
            id: node.path,
            label: node.name,
            ...(node.children && node.children.length > 0 ? { children: buildItems(node.children) } : {})
          }));
        };

        setItems(buildItems(fileTree));
      } catch (err) {
        setError('Failed to load file tree.');
      }
    };

    fetchFileTree();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  const handleSelectedItemsChange = (event: React.SyntheticEvent, itemIds: string[]) => {
    event.preventDefault();
    console.log(itemIds);
    setSelectedItems(itemIds);
  };

  return (
    <>
      {items.length > 0 ? (
        <RichTreeView
          items={items}
          selectedItems={selectedItems}
          onSelectedItemsChange={handleSelectedItemsChange}
          multiSelect
          checkboxSelection
        />
      ) : (
        <Box>
          Loading...
        </Box>
      )}
    </>
  );
};

export default FileTree;

