import torch

signs = [
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
    "del",
    "space",
    "nothing",
]


class SignsRecognizer(torch.nn.Module):
    def __init__(self):
        super(SignsRecognizer, self).__init__()
        self.fc1 = torch.nn.Linear(21 * 3, 128)
        self.fc2 = torch.nn.Linear(128, 64)
        self.fc3 = torch.nn.Linear(64, len(signs))

    def forward(self, x):
        x = torch.nn.functional.relu(self.fc1(x))
        x = torch.nn.functional.relu(self.fc2(x))
        x = torch.nn.functional.sigmoid(self.fc3(x))
        return x
