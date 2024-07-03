# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.231.6/containers/javascript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT="20-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:1-${VARIANT}

ARG SOLC_VERSION=0.8.19
ARG SLITHER_VERSION=0.10.3

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends python3-dev python3-pip python3-setuptools python3-wheel \
    && rm -rf /var/lib/apt/lists/*

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"

ENV PATH="/home/vscode/.local/bin:${PATH}"

# Set the default solc version: https://github.com/crytic/solc-select#usage
ENV SOLC_VERSION="${SOLC_VERSION}"

ENV SOLC_INSTALL_DIR="/usr/local/sbin"
ENV SOLC_PATH="${SOLC_INSTALL_DIR}/solc-v${SOLC_VERSION}"

# Install solc (required by Slither)
# https://docs.soliditylang.org/en/latest/installing-solidity.html#linux-packages
# https://github.com/crytic/solc-select
# https://github.com/nikitastupin/solc (Linux aarch64)
RUN if test "aarch64" = "$(lscpu | awk -F ':[ ]*' '/Architecture/ { print $2; }')"; then \
        curl -s -f -L "https://github.com/nikitastupin/solc/raw/main/linux/aarch64/solc-v${SOLC_VERSION}" -o "${SOLC_PATH}" \
        && chmod +x "${SOLC_PATH}" \
        && ln -fs ${SOLC_PATH} ${SOLC_INSTALL_DIR}/solc \
        && solc --version; \
    else \
        pip3 install solc-select \
        && solc-select install "${SOLC_VERSION}" \
        && solc --version; \
    fi

# Install Slither: https://github.com/crytic/slither#how-to-install
RUN pip3 install slither-analyzer=="${SLITHER_VERSION}" \
    && slither --version
