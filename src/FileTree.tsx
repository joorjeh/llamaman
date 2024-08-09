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

interface FileTreeProps {
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

const FileTree = ({
  setSelectedFiles,
}: FileTreeProps) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const getAllFilePaths = (node: FileNode): string[] => {
    let paths: string[] = [];
    if (!node.is_directory) {
      paths.push(node.path);
    } else {
      node.children.forEach(child => {
        paths = [...paths, ...getAllFilePaths(child)];
      });
    }
    return paths;
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
        {nodes.map((node, index) => (
          <TreeItem key={node.path} itemId={node.path} label={node.name}>
            {node.children.length > 0 && renderTree(node.children)}
          </TreeItem>
        ))}
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
    event.preventDefault();
    const flattenedFileTree = flattenTree(fileTree);
    const selectedNode = flattenedFileTree.find(node => node.path === itemId);

    if (selectedNode) {
      const filePaths = getAllFilePaths(selectedNode);

      if (isSelected) {
        setSelectedFiles(prevSelectedFiles => [...new Set([...prevSelectedFiles, ...filePaths])]);
      } else {
        setSelectedFiles(prevSelectedFiles => prevSelectedFiles.filter(path => !filePaths.includes(path)));
      }
    }
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

