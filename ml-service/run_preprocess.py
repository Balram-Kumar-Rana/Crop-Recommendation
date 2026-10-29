import sys
import pathlib
# Add project root to sys.path
repo_root = pathlib.Path(r'C:/Users/Balram/Desktop/recommendation')
sys.path.append(str(repo_root))

# Now import the preprocessing function
from ml_service.src.preprocess import split_and_preprocess

if __name__ == '__main__':
    split_and_preprocess()
