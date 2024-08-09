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

interface FileTreeProps {
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>
}

const FileTree = ({
  setSelectedFiles
}: FileTreeProps) => {
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TreeViewBaseItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [fileMap, setFileMap] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const config = await getUserConfig();
        const fileTree: FileNode[] = await invoke('get_file_tree', { pathString: config.workspace_dir });

        const newFileMap = new Map<string, boolean>();

        const removeWorkspaceDir = (node: FileNode) => {
          node.path = node.path.replace(new RegExp(`^${config.workspace_dir}/`), '');
          if (node.children) {
            node.children.forEach(removeWorkspaceDir);
          }
        };

        fileTree.forEach(removeWorkspaceDir);

        const buildItems = (nodes: FileNode[]): TreeViewBaseItem[] => {
          return nodes.map(node => {
            newFileMap.set(node.path, !node.is_directory);
            return {
              id: node.path,
              label: node.name,
              ...(node.children && node.children.length > 0 ? { children: buildItems(node.children) } : {})
            };
          });
        };

        setItems(buildItems(fileTree));
        setFileMap(newFileMap);
      } catch (err) {
        setError('Failed to load file tree.');
      }
    };

    fetchFileTree();

    const intervalId = setInterval(fetchFileTree, 2000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  const getAllChildrenIds = (item: TreeViewBaseItem): string[] => {
    let ids: string[] = [item.id];
    if (item.children) {
      item.children.forEach(child => {
        ids = [...ids, ...getAllChildrenIds(child)];
      });
    }
    return ids;
  };

  const handleSelectedItemsChange = (_event: React.SyntheticEvent, itemIds: string[]) => {
    let newSelectedItems = [...itemIds];
    const deselectedItems = selectedItems.filter(id => !itemIds.includes(id));

    itemIds.forEach(id => {
      const item = items.find(item => item.id === id);
      if (item && item.children) {
        newSelectedItems = [...newSelectedItems, ...getAllChildrenIds(item)];
      }
    });

    deselectedItems.forEach(id => {
      const item = items.find(item => item.id === id);
      if (item && item.children) {
        const childrenIds = getAllChildrenIds(item);
        newSelectedItems = newSelectedItems.filter(id => !childrenIds.includes(id));
      }
    });

    newSelectedItems = Array.from(new Set(newSelectedItems));

    const filesOnly = newSelectedItems.filter(id => fileMap.get(id));
    setSelectedFiles(filesOnly);
    setSelectedItems(newSelectedItems);
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

