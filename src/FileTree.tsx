// FileTree.tsx
import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { getUserConfig } from './utils';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box } from '@mui/material';

interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children: FileNode[];
}

const FileTree: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedFileRef = useRef<string[]>([]);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const config = await getUserConfig();
        const fileTree: FileNode[] = await invoke('get_file_tree', { pathString: config.workspace_dir });
        setFileTree(fileTree);
      } catch (err) {
        setError('Failed to load file tree.');
      }
    };

    fetchFileTree();
  }, []);

  const flattenTree = (nodes: FileNode[], result: FileNode[] = []): FileNode[] => {
    nodes.forEach((node) => {
      result.push(node);
      if (node.children.length > 0) {
        flattenTree(node.children, result);
      }
    });
    return result;
  }

  const renderTree = (nodes: FileNode[]): JSX.Element => {
    return (
      <SimpleTreeView
        sx={{
          textTransform: 'none',
        }}
        multiSelect
        checkboxSelection
        onItemSelectionToggle={handleItemSelectionToggle}
      >
        {nodes.map((node, index) => {
          if (node.is_directory) {
            return (
              <TreeItem key={node.path} itemId={node.path} label={node.name}>
                {node.children.length > 0 && renderTree(node.children)}
              </TreeItem>
            );
          } else {
            return (
              <TreeItem key={index} itemId={node.path} label={node.name} />
            );
          }
        })}
      </SimpleTreeView>
    );
  };

  if (error) {
    return <div>{error}</div>;
  }

  const handleItemSelectionToggle = (
    event: React.SyntheticEvent,
    itemId: string,
    isSelected: boolean,
  ) => {
    // TODO extremely inefficient, improve
    event.preventDefault();
    const flattenedFileTree = flattenTree(fileTree);
    flattenedFileTree.forEach((node) => {
      if (node.path === itemId && !node.is_directory) {
        if (isSelected) {
          selectedFileRef.current.push(itemId);
        } else {
          selectedFileRef.current = selectedFileRef.current.filter((path) => path !== itemId);
        }
      }
    });
  }

    return (
      <>
        {fileTree ? (
          renderTree(fileTree)
        ) : (
          <Box>
            Loading...
          </Box>
        )}
      </>
    );
  };

  export default FileTree;
